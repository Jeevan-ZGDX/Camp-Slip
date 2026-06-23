from django.utils import timezone
from django.conf import settings
from campuspass.common.enums import OutpassStatus, ApprovalAction
from .models import OutpassRequest


class OutpassService:

    @staticmethod
    def can_create_outpass(student):
        active_count = OutpassRequest.objects.filter(
            student=student,
            status__in=[
                OutpassStatus.PENDING,
                OutpassStatus.FACULTY_APPROVED,
                OutpassStatus.HOD_APPROVED,
                OutpassStatus.WARDEN_APPROVED,
                OutpassStatus.APPROVED,
            ],
        ).count()
        return active_count < settings.OUTPASS_MAX_ACTIVE

    @staticmethod
    def get_approval_flow(outpass):
        flow = []
        if outpass.requires_faculty_approval:
            flow.append({
                'level': 'FACULTY',
                'required_role': 'FACULTY',
                'approver': outpass.student.faculty_advisor,
                'status': ApprovalAction.PENDING,
            })
        if outpass.requires_hod_approval:
            flow.append({
                'level': 'HOD',
                'required_role': 'HOD',
                'approver': outpass.student.department.hod if outpass.student.department else None,
                'status': ApprovalAction.PENDING,
            })
        if outpass.requires_warden_approval:
            flow.append({
                'level': 'WARDEN',
                'required_role': 'WARDEN',
                'approver': outpass.student.hostel.warden if outpass.student.hostel else None,
                'status': ApprovalAction.PENDING,
            })
        return flow

    @staticmethod
    def process_approval(outpass, action, approved_by, remarks=''):
        current_level = outpass.current_approval_level

        if action == ApprovalAction.REJECTED:
            outpass.status = OutpassStatus.REJECTED
            outpass.remarks = remarks
            outpass.save()
            return outpass

        if current_level == 'FACULTY':
            if outpass.requires_hod_approval:
                outpass.status = OutpassStatus.FACULTY_APPROVED
                outpass.current_approval_level = 'HOD'
            elif outpass.requires_warden_approval:
                outpass.status = OutpassStatus.FACULTY_APPROVED
                outpass.current_approval_level = 'WARDEN'
            else:
                outpass.status = OutpassStatus.APPROVED
        elif current_level == 'HOD':
            if outpass.requires_warden_approval:
                outpass.status = OutpassStatus.HOD_APPROVED
                outpass.current_approval_level = 'WARDEN'
            else:
                outpass.status = OutpassStatus.APPROVED
        elif current_level == 'WARDEN':
            outpass.status = OutpassStatus.WARDEN_APPROVED
            outpass.current_approval_level = 'COMPLETED'

        if outpass.status == OutpassStatus.APPROVED or outpass.status == OutpassStatus.WARDEN_APPROVED:
            from campuspass.apps.qr_codes.services import QRCodeService
            QRCodeService.generate_qr_for_outpass(outpass)

        outpass.remarks = remarks or outpass.remarks
        outpass.save()
        return outpass

    @staticmethod
    def expire_outdated_outpasses():
        expired = OutpassRequest.objects.filter(
            status__in=[
                OutpassStatus.APPROVED,
                OutpassStatus.WARDEN_APPROVED,
            ],
            expected_return_datetime__lt=timezone.now(),
        )
        count = expired.count()
        expired.update(status=OutpassStatus.EXPIRED)
        return count
