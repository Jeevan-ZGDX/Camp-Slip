import io
import uuid
from django.core.files.base import ContentFile
from django.conf import settings
from django.utils import timezone
import qrcode
from .models import QRPass
from campuspass.common.enums import AuditAction, OutpassStatus
from campuspass.common.utils import get_qr_expiry
from campuspass.apps.audit.services import AuditService


class QRCodeService:

    @staticmethod
    def generate_qr_for_outpass(outpass, request=None):
        existing = QRPass.objects.filter(outpass=outpass).first()
        if existing:
            return existing

        token = str(uuid.uuid4())
        expires_at = get_qr_expiry()

        qr_pass = QRPass.objects.create(
            outpass=outpass,
            token=token,
            expires_at=expires_at,
        )

        qr_image = QRCodeService._generate_qr_image(token)
        qr_pass.qr_image.save(
            f'qr_{outpass.id}_{token[:8]}.png',
            ContentFile(qr_image.getvalue()),
            save=True,
        )

        AuditService.log(
            AuditAction.QR_GENERATE,
            outpass.student.user if request is None else request.user,
            'QRPass', str(qr_pass.id),
            f'QR generated for outpass {outpass.id}',
            request=request,
        )

        return qr_pass

    @staticmethod
    def _generate_qr_image(token):
        qr_data = f'{{"token":"{token}"}}'

        qr = qrcode.QRCode(
            version=2,
            error_correction=qrcode.constants.ERROR_CORRECT_H,
            box_size=10,
            border=2,
        )
        qr.add_data(qr_data)
        qr.make(fit=True)

        img = qr.make_image(fill_color='black', back_color='white')

        buffer = io.BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        return buffer

    @staticmethod
    def verify_qr_token(token):
        try:
            qr_pass = QRPass.objects.select_related(
                'outpass__student__user',
                'outpass__student__department',
                'outpass__student__course',
                'outpass__student__hostel',
            ).get(token=token)
        except QRPass.DoesNotExist:
            return None, 'INVALID_TOKEN', 'Invalid QR token'

        if qr_pass.is_revoked:
            return qr_pass, 'REVOKED', 'This pass has been revoked'

        if qr_pass.is_expired:
            return qr_pass, 'EXPIRED', 'This pass has expired'

        outpass = qr_pass.outpass

        if outpass.status not in [OutpassStatus.APPROVED, OutpassStatus.WARDEN_APPROVED]:
            return qr_pass, 'NOT_APPROVED', f'Outpass status is {outpass.status}'

        if not outpass.student.is_active:
            return qr_pass, 'STUDENT_INACTIVE', 'Student account is inactive'

        if outpass.is_revoked:
            return qr_pass, 'REVOKED', 'Outpass has been revoked'

        return qr_pass, 'VALID', 'QR is valid'

    @staticmethod
    def mark_verified(qr_pass, request=None):
        qr_pass.verification_count += 1
        qr_pass.last_verified_at = timezone.now()
        qr_pass.save(update_fields=['verification_count', 'last_verified_at'])

    @staticmethod
    def revoke_qr_pass(qr_pass, reason='', request=None):
        qr_pass.is_revoked = True
        qr_pass.revoked_at = timezone.now()
        qr_pass.revoked_reason = reason
        qr_pass.save()

        AuditService.log(
            AuditAction.UPDATE,
            request.user if request else None,
            'QRPass', str(qr_pass.id),
            f'QR revoked: {reason[:100]}',
            request=request,
        )

    @staticmethod
    def get_qr_data(qr_pass):
        outpass = qr_pass.outpass
        student = outpass.student
        user = student.user

        return {
            'pass': {
                'token': qr_pass.token,
                'expires_at': qr_pass.expires_at.isoformat() if qr_pass.expires_at else None,
                'is_valid': qr_pass.is_valid,
                'time_remaining': qr_pass.time_remaining,
                'qr_image_url': qr_pass.qr_image.url if qr_pass.qr_image else None,
            },
            'outpass': {
                'id': str(outpass.id),
                'type': outpass.outpass_type,
                'reason': outpass.reason,
                'destination': outpass.destination,
                'departure_datetime': outpass.departure_datetime.isoformat() if outpass.departure_datetime else None,
                'expected_return_datetime': outpass.expected_return_datetime.isoformat() if outpass.expected_return_datetime else None,
                'status': outpass.status,
                'duration_hours': outpass.duration_hours,
            },
            'student': {
                'id': str(student.id),
                'student_id': student.student_id,
                'enrollment_number': student.enrollment_number,
                'name': user.get_full_name,
                'email': user.email,
                'phone': user.phone or '',
                'gender': user.gender or '',
                'profile_image': user.profile_image.url if user.profile_image else None,
                'department': student.department.name if student.department else None,
                'course': student.course.name if student.course else None,
                'current_year': student.current_year,
                'batch': student.batch,
                'hostel': student.hostel.name if student.hostel else None,
                'room_number': student.room_number,
            },
        }

    @staticmethod
    def cleanup_expired():
        count = QRPass.objects.filter(expires_at__lt=timezone.now()).count()
        return count
