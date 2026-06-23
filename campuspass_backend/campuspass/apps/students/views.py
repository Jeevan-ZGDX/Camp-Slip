from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, OpenApiParameter
from .models import StudentProfile
from .serializers import (
    StudentProfileSerializer, StudentProfileCreateSerializer,
    StudentProfileUpdateSerializer, StudentListSerializer,
)
from campuspass.common.permissions import IsAdmin, IsOwnProfile
from campuspass.common.responses import success_response, created_response, error_response
from campuspass.common.pagination import PaginatedResponseMixin
from campuspass.common.enums import AuditAction
from campuspass.apps.audit.services import AuditService


@extend_schema(tags=['Students'])
class StudentProfileViewSet(viewsets.ModelViewSet, PaginatedResponseMixin):
    queryset = StudentProfile.objects.select_related(
        'user', 'department', 'course', 'hostel', 'faculty_advisor'
    ).all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'is_active': ['exact'],
        'is_in_hostel': ['exact'],
        'department': ['exact'],
        'course': ['exact'],
        'current_year': ['exact'],
        'current_semester': ['exact'],
        'batch': ['exact', 'contains'],
        'hostel': ['exact'],
        'faculty_advisor': ['exact'],
    }
    search_fields = [
        'student_id', 'enrollment_number', 'user__first_name',
        'user__last_name', 'user__email', 'user__phone',
    ]
    ordering_fields = [
        'student_id', 'user__first_name', 'user__last_name',
        'current_year', 'batch', 'created_at',
    ]

    def get_serializer_class(self):
        if self.action == 'list':
            return StudentListSerializer
        elif self.action in ('create', 'bulk_create'):
            return StudentProfileCreateSerializer
        elif self.action in ('partial_update', 'update'):
            return StudentProfileUpdateSerializer
        return StudentProfileSerializer

    def get_permissions(self):
        if self.action in ('retrieve', 'me'):
            return [permissions.IsAuthenticated()]
        elif self.action == 'update' or self.action == 'partial_update':
            return [permissions.IsAuthenticated(), IsOwnProfile()]
        return [permissions.IsAuthenticated(), IsAdmin()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'STUDENT':
            return self.queryset.filter(user=user, is_active=True)
        if user.role == 'FACULTY':
            return self.queryset.filter(faculty_advisor=user, is_active=True)
        if user.role == 'HOD':
            return self.queryset.filter(department__hod=user, is_active=True)
        if user.role == 'WARDEN':
            return self.queryset.filter(hostel__warden=user, is_active=True)
        return self.queryset

    @extend_schema(summary='List student profiles', parameters=[
        OpenApiParameter(name='search', description='Search by ID, name, email', required=False, type=str),
        OpenApiParameter(name='department', description='Filter by department ID', required=False, type=str),
        OpenApiParameter(name='batch', description='Filter by batch', required=False, type=str),
        OpenApiParameter(name='is_in_hostel', description='Filter by hostel status', required=False, type=bool),
    ])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(summary='Create student profile')
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(summary='Get student profile details')
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(summary='Update student profile')
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @extend_schema(summary='Partially update student profile')
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(summary='Deactivate student profile')
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        AuditService.log(AuditAction.DELETE, request.user, 'StudentProfile', str(instance.id),
                         f'Student profile deactivated: {instance.student_id}', request=request)
        return success_response(message='Student profile deactivated')

    @extend_schema(summary='Get current student profile')
    @action(detail=False, methods=['get'])
    def me(self, request):
        try:
            profile = StudentProfile.objects.select_related(
                'user', 'department', 'course', 'hostel', 'faculty_advisor'
            ).get(user=request.user)
            serializer = StudentProfileSerializer(profile)
            return success_response(data=serializer.data)
        except StudentProfile.DoesNotExist:
            return error_response('Student profile not found.', status_code=status.HTTP_404_NOT_FOUND)

    @extend_schema(summary='Get active outpasses for student')
    @action(detail=True, methods=['get'])
    def active_outpasses(self, request, pk=None):
        student = self.get_object()
        from campuspass.apps.outpass.models import OutpassRequest
        outpasses = OutpassRequest.objects.filter(
            student=student,
            status__in=['APPROVED', 'PENDING', 'FACULTY_APPROVED', 'HOD_APPROVED', 'WARDEN_APPROVED'],
        ).select_related('student__user').order_by('-created_at')
        from campuspass.apps.outpass.serializers import OutpassListSerializer
        serializer = OutpassListSerializer(outpasses, many=True)
        return success_response(data=serializer.data)

    @extend_schema(summary='Get student movement history')
    @action(detail=True, methods=['get'])
    def movement_history(self, request, pk=None):
        student = self.get_object()
        from campuspass.apps.verification.models import EntryExitLog
        logs = EntryExitLog.objects.filter(
            outpass__student=student
        ).select_related(
            'outpass', 'verified_by'
        ).order_by('-exit_time')
        from campuspass.apps.verification.serializers import EntryExitLogSerializer
        serializer = EntryExitLogSerializer(logs, many=True)
        return success_response(data=serializer.data)

    @extend_schema(summary='Get students outside campus')
    @action(detail=False, methods=['get'])
    def outside_campus(self, request):
        queryset = self.get_queryset().filter(
            is_in_hostel=False, is_active=True
        )
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = StudentListSerializer(page, many=True)
            return success_response(
                data=serializer.data,
                meta={
                    'count': queryset.count(),
                    'page': page.number,
                }
            )
        serializer = StudentListSerializer(queryset, many=True)
        return success_response(data=serializer.data)
