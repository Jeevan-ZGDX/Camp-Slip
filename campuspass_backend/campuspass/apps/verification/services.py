from django.utils import timezone
from .models import EntryExitLog, MovementHistory
from campuspass.apps.qr_codes.services import QRCodeService
from campuspass.apps.outpass.models import OutpassRequest
from campuspass.common.enums import OutpassStatus, AuditAction, MovementType, VerificationResult
from campuspass.common.utils import get_client_ip
from campuspass.apps.audit.services import AuditService


class EntryExitService:

    @staticmethod
    def verify_and_record_exit(token, verified_by, request=None):
        qr_pass, result_code, message = QRCodeService.verify_qr_token(token)

        if result_code != 'VALID':
            return {'status': 'error', 'message': message, 'code': result_code}

        outpass = qr_pass.outpass
        student = outpass.student

        existing_exit = EntryExitLog.objects.filter(
            outpass=outpass, movement_type=MovementType.EXIT
        ).exists()

        if existing_exit:
            return {'status': 'error', 'message': 'Exit already recorded for this outpass'}

        ip_address = get_client_ip(request) if request else None

        log = EntryExitLog.objects.create(
            outpass=outpass,
            movement_type=MovementType.EXIT,
            verified_by=verified_by,
            verification_result=VerificationResult.VALID,
            ip_address=ip_address,
            location=request.data.get('location', '') if request else '',
            device_info=request.data.get('device_info', '') if request else '',
            exit_time=timezone.now(),
        )

        QRCodeService.mark_verified(qr_pass, request)

        outpass.status = OutpassStatus.USED
        outpass.save(update_fields=['status'])

        movement = MovementHistory.objects.create(
            student=student,
            outpass=outpass,
            exit_time=timezone.now(),
            verified_by_exit=verified_by,
            status='OUTSIDE',
        )

        student.is_in_hostel = False
        student.save(update_fields=['is_in_hostel'])

        AuditService.log(
            AuditAction.EXIT_RECORD, verified_by, 'EntryExitLog', str(log.id),
            f'Exit recorded for student {student.user.get_full_name}', request=request
        )

        full_data = QRCodeService.get_qr_data(qr_pass)

        return {
            'status': 'success',
            'message': 'Exit recorded successfully',
            'data': {
                'log': EntryExitLogSerializer(log).data,
                'student': full_data['student'],
                'outpass': full_data['outpass'],
            },
        }

    @staticmethod
    def verify_and_record_entry(token, verified_by, request=None):
        qr_pass, result_code, message = QRCodeService.verify_qr_token(token)

        if result_code != 'VALID':
            return {'status': 'error', 'message': message, 'code': result_code}

        outpass = qr_pass.outpass
        student = outpass.student

        existing_entry = EntryExitLog.objects.filter(
            outpass=outpass, movement_type=MovementType.ENTRY
        ).exists()

        if existing_entry:
            return {'status': 'error', 'message': 'Entry already recorded for this outpass'}

        ip_address = get_client_ip(request) if request else None

        log = EntryExitLog.objects.create(
            outpass=outpass,
            movement_type=MovementType.ENTRY,
            verified_by=verified_by,
            verification_result=VerificationResult.VALID,
            ip_address=ip_address,
            location=request.data.get('location', '') if request else '',
            device_info=request.data.get('device_info', '') if request else '',
            entry_time=timezone.now(),
        )

        QRCodeService.mark_verified(qr_pass, request)

        try:
            movement = MovementHistory.objects.get(
                outpass=outpass, student=student, status='OUTSIDE'
            )
            movement.entry_time = timezone.now()
            movement.verified_by_entry = verified_by
            movement.status = 'RETURNED'

            if movement.exit_time:
                delta = movement.entry_time - movement.exit_time
                movement.total_hours = round(delta.total_seconds() / 3600, 2)

                if delta.total_seconds() > outpass.duration_hours * 3600:
                    movement.status = 'OVERSTAY'

            movement.save()
        except MovementHistory.DoesNotExist:
            movement = MovementHistory.objects.create(
                student=student,
                outpass=outpass,
                exit_time=outpass.departure_datetime,
                entry_time=timezone.now(),
                verified_by_entry=verified_by,
                status='RETURNED',
            )

        outpass.actual_return_datetime = timezone.now()
        outpass.save(update_fields=['actual_return_datetime'])

        student.is_in_hostel = True
        student.save(update_fields=['is_in_hostel'])

        AuditService.log(
            AuditAction.ENTRY_RECORD, verified_by, 'EntryExitLog', str(log.id),
            f'Entry recorded for student {student.user.get_full_name}', request=request
        )

        full_data = QRCodeService.get_qr_data(qr_pass)

        return {
            'status': 'success',
            'message': 'Entry recorded successfully. Student returned to campus.' if movement.status != 'OVERSTAY' else 'Entry recorded. Student overstayed.',
            'data': {
                'log': EntryExitLogSerializer(log).data,
                'student': full_data['student'],
                'outpass': full_data['outpass'],
                'movement': MovementHistorySerializer(movement).data if movement else None,
            },
        }

    @staticmethod
    def get_active_outside_students():
        return MovementHistory.objects.filter(
            status='OUTSIDE'
        ).select_related(
            'student__user', 'student__department', 'student__hostel',
            'outpass',
        ).order_by('-exit_time')

    @staticmethod
    def get_student_movement_history(student_id):
        return MovementHistory.objects.filter(
            student_id=student_id
        ).select_related(
            'verified_by_exit', 'verified_by_entry'
        ).order_by('-exit_time')


from .serializers import EntryExitLogSerializer, MovementHistorySerializer
