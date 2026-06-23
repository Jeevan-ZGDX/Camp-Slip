from django.db.models import Count, Q, Sum, Avg, F
from django.db.models.functions import TruncMonth, TruncDay
from django.utils import timezone
from datetime import timedelta
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema, OpenApiParameter
from campuspass.common.enums import OutpassStatus, UserRole
from campuspass.common.permissions import IsAdmin, IsWarden
from campuspass.apps.authentication.models import User
from campuspass.common.responses import success_response, error_response
from campuspass.apps.outpass.models import OutpassRequest
from campuspass.apps.students.models import StudentProfile
from campuspass.apps.approvals.models import Approval
from campuspass.apps.verification.models import MovementHistory
from campuspass.apps.departments.models import Department, Hostel


@extend_schema(tags=['Dashboard'])
class DashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    @extend_schema(summary='Get main dashboard statistics')
    def get(self, request):
        user = request.user

        if user.role == UserRole.STUDENT:
            return self._student_dashboard(user)
        elif user.role == UserRole.FACULTY:
            return self._faculty_dashboard(user)
        elif user.role == UserRole.HOD:
            return self._hod_dashboard(user)
        elif user.role == UserRole.WARDEN:
            return self._warden_dashboard(user)
        elif user.role == UserRole.SECURITY:
            return self._security_dashboard(user)
        elif user.role == UserRole.ADMIN:
            return self._admin_dashboard()
        return success_response(data={})

    def _student_dashboard(self, user):
        try:
            student = StudentProfile.objects.get(user=user)
        except StudentProfile.DoesNotExist:
            return success_response(data={'error': 'Student profile not found'})

        outpasses = OutpassRequest.objects.filter(student=student)

        return success_response(data={
            'total_outpasses': outpasses.count(),
            'pending': outpasses.filter(status=OutpassStatus.PENDING).count(),
            'approved': outpasses.filter(status=OutpassStatus.APPROVED).count(),
            'rejected': outpasses.filter(status=OutpassStatus.REJECTED).count(),
            'active_outpasses': outpasses.filter(
                status__in=[OutpassStatus.APPROVED, OutpassStatus.PENDING,
                            OutpassStatus.FACULTY_APPROVED, OutpassStatus.HOD_APPROVED,
                            OutpassStatus.WARDEN_APPROVED]
            ).count(),
            'is_outside': not student.is_in_hostel,
            'recent_outpasses': OutpassRequest.objects.filter(student=student).values(
                'id', 'outpass_type', 'status', 'created_at'
            )[:5],
        })

    def _faculty_dashboard(self, user):
        advised_students = StudentProfile.objects.filter(faculty_advisor=user)
        student_ids = advised_students.values_list('id', flat=True)

        outpasses = OutpassRequest.objects.filter(student_id__in=student_ids)
        pending = outpasses.filter(status=OutpassStatus.PENDING).count()

        return success_response(data={
            'total_students': advised_students.count(),
            'pending_approvals': pending,
            'approved_today': outpasses.filter(
                status=OutpassStatus.FACULTY_APPROVED,
                created_at__date=timezone.now().date()
            ).count(),
            'total_outpasses': outpasses.count(),
        })

    def _hod_dashboard(self, user):
        dept = Department.objects.filter(hod=user).first()
        if not dept:
            return success_response(data={'error': 'No department assigned'})

        students = StudentProfile.objects.filter(department=dept)
        student_ids = students.values_list('id', flat=True)
        outpasses = OutpassRequest.objects.filter(student_id__in=student_ids)

        return success_response(data={
            'department': dept.name,
            'total_students': students.count(),
            'total_outpasses': outpasses.count(),
            'pending_approvals': outpasses.filter(
                status__in=[OutpassStatus.PENDING, OutpassStatus.FACULTY_APPROVED]
            ).count(),
            'approved': outpasses.filter(status=OutpassStatus.APPROVED).count(),
            'rejected': outpasses.filter(status=OutpassStatus.REJECTED).count(),
            'currently_outside': students.filter(is_in_hostel=False).count(),
        })

    def _warden_dashboard(self, user):
        hostel = Hostel.objects.filter(warden=user).first()
        if not hostel:
            return success_response(data={'error': 'No hostel assigned'})

        students = StudentProfile.objects.filter(hostel=hostel)
        student_ids = students.values_list('id', flat=True)
        outpasses = OutpassRequest.objects.filter(student_id__in=student_ids)

        return success_response(data={
            'hostel': hostel.name,
            'total_residents': students.count(),
            'currently_outside': students.filter(is_in_hostel=False).count(),
            'current_occupancy': students.filter(is_in_hostel=True).count(),
            'total_outpasses': outpasses.count(),
            'pending_approvals': outpasses.filter(
                status__in=[OutpassStatus.PENDING, OutpassStatus.FACULTY_APPROVED, OutpassStatus.HOD_APPROVED]
            ).count(),
            'active_outpasses': outpasses.filter(status=OutpassStatus.APPROVED).count(),
            'overstays_today': MovementHistory.objects.filter(
                student_id__in=student_ids,
                status='OVERSTAY',
                exit_time__date=timezone.now().date(),
            ).count(),
        })

    def _security_dashboard(self, user):
        today = timezone.now().date()
        return success_response(data={
            'today_exits': MovementHistory.objects.filter(
                exit_time__date=today, verified_by_exit=user
            ).count(),
            'today_entries': MovementHistory.objects.filter(
                entry_time__date=today, verified_by_entry=user
            ).count(),
            'currently_outside': MovementHistory.objects.filter(status='OUTSIDE').count(),
            'total_verifications_today': MovementHistory.objects.filter(
                Q(verified_by_exit=user) | Q(verified_by_entry=user),
                created_at__date=today,
            ).count(),
        })

    def _admin_dashboard(self):
        today = timezone.now().date()
        total_students = StudentProfile.objects.filter(is_active=True).count()

        return success_response(data={
            'overview': {
                'total_users': User.objects.filter(is_active=True).count(),
                'total_students': total_students,
                'total_departments': Department.objects.filter(is_active=True).count(),
                'total_hostels': Hostel.objects.filter(is_active=True).count(),
                'currently_outside_campus': StudentProfile.objects.filter(is_in_hostel=False, is_active=True).count(),
            },
            'outpass_stats': {
                'total': OutpassRequest.objects.count(),
                'today': OutpassRequest.objects.filter(created_at__date=today).count(),
                'pending': OutpassRequest.objects.filter(
                    status__in=[OutpassStatus.PENDING, OutpassStatus.FACULTY_APPROVED,
                                OutpassStatus.HOD_APPROVED, OutpassStatus.WARDEN_APPROVED]
                ).count(),
                'approved': OutpassRequest.objects.filter(status=OutpassStatus.APPROVED).count(),
                'rejected': OutpassRequest.objects.filter(status=OutpassStatus.REJECTED).count(),
                'expired': OutpassRequest.objects.filter(status=OutpassStatus.EXPIRED).count(),
                'used': OutpassRequest.objects.filter(status=OutpassStatus.USED).count(),
            },
            'verification_stats': {
                'today_exits': MovementHistory.objects.filter(exit_time__date=today).count(),
                'today_entries': MovementHistory.objects.filter(entry_time__date=today).count(),
                'currently_outside': MovementHistory.objects.filter(status='OUTSIDE').count(),
                'overstays': MovementHistory.objects.filter(status='OVERSTAY').count(),
            },
        })


@extend_schema(tags=['Dashboard'])
class AnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(summary='Get department-wise statistics')
    def get(self, request):
        if request.user.role not in [UserRole.ADMIN, UserRole.HOD]:
            return error_response('Permission denied.', status_code=status.HTTP_403_FORBIDDEN)

        report_type = request.query_params.get('type', 'department')
        days = int(request.query_params.get('days', 30))
        cutoff = timezone.now() - timedelta(days=days)

        if report_type == 'department':
            return self._department_stats(cutoff)
        elif report_type == 'monthly':
            return self._monthly_stats(cutoff)
        elif report_type == 'daily':
            return self._daily_stats(cutoff)
        elif report_type == 'hostel':
            return self._hostel_stats(cutoff)
        elif report_type == 'approval':
            return self._approval_stats(cutoff)
        return success_response(data={})

    def _department_stats(self, cutoff):
        departments = Department.objects.filter(is_active=True).annotate(
            student_count=Count('student_profiles', filter=Q(student_profiles__is_active=True)),
            outpass_count=Count('student_profiles__outpass_requests',
                                filter=Q(student_profiles__outpass_requests__created_at__gte=cutoff)),
        ).values('name', 'code', 'student_count', 'outpass_count')
        return success_response(data=list(departments))

    def _monthly_stats(self, cutoff):
        monthly = OutpassRequest.objects.filter(
            created_at__gte=cutoff
        ).annotate(
            month=TruncMonth('created_at')
        ).values('month').annotate(
            total=Count('id'),
            approved=Count('id', filter=Q(status=OutpassStatus.APPROVED)),
            rejected=Count('id', filter=Q(status=OutpassStatus.REJECTED)),
            pending=Count('id', filter=Q(
                status__in=[OutpassStatus.PENDING, OutpassStatus.FACULTY_APPROVED,
                            OutpassStatus.HOD_APPROVED, OutpassStatus.WARDEN_APPROVED]
            )),
        ).order_by('month')
        return success_response(data=list(monthly))

    def _daily_stats(self, cutoff):
        daily = OutpassRequest.objects.filter(
            created_at__gte=cutoff
        ).annotate(
            day=TruncDay('created_at')
        ).values('day').annotate(
            total=Count('id'),
            approved=Count('id', filter=Q(status=OutpassStatus.APPROVED)),
            rejected=Count('id', filter=Q(status=OutpassStatus.REJECTED)),
        ).order_by('day')
        return success_response(data=list(daily))

    def _hostel_stats(self, cutoff):
        hostels = Hostel.objects.filter(is_active=True).annotate(
            resident_count=Count('student_profiles', filter=Q(student_profiles__is_active=True)),
            outside_count=Count('student_profiles',
                                filter=Q(student_profiles__is_in_hostel=False, student_profiles__is_active=True)),
            outpass_count=Count('student_profiles__outpass_requests',
                                filter=Q(student_profiles__outpass_requests__created_at__gte=cutoff)),
        ).values('name', 'code', 'type', 'capacity', 'resident_count', 'outside_count', 'outpass_count')
        return success_response(data=list(hostels))

    def _approval_stats(self, cutoff):
        avg_approval_time = Approval.objects.filter(
            created_at__gte=cutoff
        ).aggregate(
            avg_time=Avg(models.F('updated_at') - models.F('created_at'))
        )
        approval_counts = Approval.objects.filter(
            created_at__gte=cutoff
        ).values('approval_level').annotate(
            total=Count('id'),
            approved=Count('id', filter=Q(action='APPROVED')),
            rejected=Count('id', filter=Q(action='REJECTED')),
        ).order_by('approval_level')
        return success_response(data={
            'avg_approval_time_seconds': avg_approval_time.get('avg_time'),
            'by_level': list(approval_counts),
        })

