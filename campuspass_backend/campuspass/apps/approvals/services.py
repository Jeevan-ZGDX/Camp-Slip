from django.utils import timezone
from .models import Approval
from campuspass.apps.outpass.services import OutpassService
from campuspass.apps.outpass.models import OutpassRequest
from campuspass.common.enums import OutpassStatus, ApprovalAction, AuditAction, UserRole
from campuspass.common.utils import get_client_ip
from campuspass.apps.audit.services import AuditService


class ApprovalService:

    @staticmethod
    def process_approval(outpass_id, approver, action, comments='', request=None):
        try:
            outpass = OutpassRequest.objects.select_related(
                'student__user', 'student__department', 'student__hostel',
                'student__faculty_advisor',
            ).get(id=outpass_id)
        except OutpassRequest.DoesNotExist:
            return None, 'Outpass not found'

        if not outpass.is_pending:
            return None, f'Outpass is already {outpass.status}'

        current_level = outpass.current_approval_level
        role_map = {
            UserRole.FACULTY: 'FACULTY',
            UserRole.HOD: 'HOD',
            UserRole.WARDEN: 'WARDEN',
        }

        if approver.role not in role_map:
            return None, 'You are not authorized to approve outpasses'

        expected_level = role_map[approver.role]
        if current_level != expected_level:
            return None, f'Current approval stage is {current_level}, not {expected_level}'

        ip_address = get_client_ip(request) if request else None

        approval = Approval.objects.create(
            outpass=outpass,
            approver=approver,
            approval_level=current_level,
            action=action,
            comments=comments,
            ip_address=ip_address,
        )

        if action == ApprovalAction.REJECTED:
            outpass.status = OutpassStatus.REJECTED
            outpass.remarks = comments
            outpass.save()

            AuditService.log(
                AuditAction.REJECT, approver, 'OutpassRequest', str(outpass.id),
                f'Outpass rejected at {current_level} level: {comments[:100]}',
                request=request,
            )
            return approval, 'Outpass rejected'

        outpass = OutpassService.process_approval(outpass, action, approver, comments)

        AuditService.log(
            AuditAction.APPROVE, approver, 'OutpassRequest', str(outpass.id),
            f'Outpass approved at {current_level} level',
            request=request,
        )

        action_msg = 'approved' if action == ApprovalAction.APPROVED else 'rejected'
        return approval, f'Outpass {action_msg} at {current_level} level'

    @staticmethod
    def get_pending_approvals_for_user(user):
        from campuspass.apps.students.models import StudentProfile
        from campuspass.apps.outpass.models import OutpassRequest
        from django.db.models import Q

        base_query = OutpassRequest.objects.filter(
            Q(status=OutpassStatus.PENDING) |
            Q(status=OutpassStatus.FACULTY_APPROVED) |
            Q(status=OutpassStatus.HOD_APPROVED) |
            Q(status=OutpassStatus.WARDEN_APPROVED)
        )

        if user.role == UserRole.FACULTY:
            return base_query.filter(
                student__faculty_advisor=user,
                status=OutpassStatus.PENDING,
            ).order_by('-is_urgent', '-created_at')

        elif user.role == UserRole.HOD:
            return base_query.filter(
                student__department__hod=user,
                status__in=[OutpassStatus.FACULTY_APPROVED, OutpassStatus.PENDING],
            )

        elif user.role == UserRole.WARDEN:
            return base_query.filter(
                student__hostel__warden=user,
                status__in=[OutpassStatus.FACULTY_APPROVED, OutpassStatus.HOD_APPROVED, OutpassStatus.PENDING],
            )

        return OutpassRequest.objects.none()

    @staticmethod
    def get_approval_history(outpass_id):
        return Approval.objects.filter(outpass_id=outpass_id).order_by('created_at')
