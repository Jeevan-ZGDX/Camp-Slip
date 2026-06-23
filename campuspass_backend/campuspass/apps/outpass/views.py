from rest_framework import viewsets, permissions, filters, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiParameter
from .models import OutpassRequest
from .serializers import (
    OutpassSerializer, OutpassCreateSerializer, OutpassListSerializer,
    OutpassStatusUpdateSerializer, OutpassRevokeSerializer,
)
from .services import OutpassService
from campuspass.common.enums import OutpassStatus, AuditAction, UserRole
from campuspass.common.permissions import IsStudent, IsOwnerOrApprover
from campuspass.common.responses import success_response, created_response, error_response
from campuspass.common.pagination import PaginatedResponseMixin
from campuspass.apps.audit.services import AuditService
from campuspass.apps.students.models import StudentProfile


@extend_schema(tags=['Outpass'])
class OutpassViewSet(viewsets.ModelViewSet, PaginatedResponseMixin):
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'status': ['exact', 'in'],
        'outpass_type': ['exact'],
        'is_urgent': ['exact'],
        'is_revoked': ['exact'],
        'created_at': ['gte', 'lte', 'date'],
        'departure_datetime': ['gte', 'lte'],
        'student__department': ['exact'],
        'student__hostel': ['exact'],
        'student__batch': ['exact'],
    }
    search_fields = [
        'reason', 'destination', 'student__user__first_name',
        'student__user__last_name', 'student__student_id',
    ]
    ordering_fields = ['created_at', 'departure_datetime', 'expected_return_datetime', 'status']

    def get_serializer_class(self):
        if self.action == 'create':
            return OutpassCreateSerializer
        elif self.action == 'list':
            return OutpassListSerializer
        return OutpassSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated(), IsStudent()]
        elif self.action in ('update', 'partial_update', 'destroy'):
            return [permissions.IsAuthenticated(), IsOwnerOrApprover()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        queryset = OutpassRequest.objects.select_related(
            'student__user', 'student__department', 'student__course',
            'student__hostel', 'cancelled_by',
        ).all()

        if user.role == UserRole.STUDENT:
            try:
                student = StudentProfile.objects.get(user=user)
                return queryset.filter(student=student)
            except StudentProfile.DoesNotExist:
                return queryset.none()

        if user.role == UserRole.FACULTY:
            return queryset.filter(student__faculty_advisor=user)

        if user.role == UserRole.HOD:
            return queryset.filter(student__department__hod=user)

        if user.role == UserRole.WARDEN:
            return queryset.filter(student__hostel__warden=user)

        if user.role == UserRole.SECURITY:
            return queryset.filter(status__in=[OutpassStatus.APPROVED, OutpassStatus.USED])

        return queryset

    @extend_schema(summary='List outpass requests', parameters=[
        OpenApiParameter(name='status', description='Filter by status', required=False, type=str),
        OpenApiParameter(name='outpass_type', description='Filter by type', required=False, type=str),
        OpenApiParameter(name='is_urgent', description='Filter urgent', required=False, type=bool),
        OpenApiParameter(name='search', description='Search by reason, destination, student name', required=False, type=str),
    ])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(summary='Create outpass request')
    def create(self, request, *args, **kwargs):
        try:
            student = StudentProfile.objects.get(user=request.user)
        except StudentProfile.DoesNotExist:
            return error_response('Student profile not found.', status_code=status.HTTP_404_NOT_FOUND)

        if not OutpassService.can_create_outpass(student):
            return error_response(
                f'You already have {OutpassRequest.objects.filter(student=student, status__in=["PENDING", "FACULTY_APPROVED", "HOD_APPROVED", "WARDEN_APPROVED", "APPROVED"]).count()} active outpasses. Maximum is 3.',
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        outpass = serializer.save(student=student)

        AuditService.log(
            AuditAction.CREATE, request.user, 'OutpassRequest', str(outpass.id),
            f'Outpass created: {outpass.outpass_type} - {outpass.reason[:100]}', request=request
        )

        from .tasks import notify_outpass_created
        notify_outpass_created.delay(str(outpass.id))

        return created_response(
            data=OutpassSerializer(outpass).data,
            message='Outpass request submitted successfully.',
        )

    @extend_schema(summary='Get outpass details')
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(summary='Update outpass request')
    def update(self, request, *args, **kwargs):
        outpass = self.get_object()
        if outpass.status != OutpassStatus.PENDING:
            return error_response('Cannot update outpass after it has been processed.')
        return super().update(request, *args, **kwargs)

    @extend_schema(summary='Cancel outpass request')
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        outpass = self.get_object()
        if outpass.status not in [OutpassStatus.PENDING, OutpassStatus.FACULTY_APPROVED, OutpassStatus.HOD_APPROVED, OutpassStatus.WARDEN_APPROVED]:
            return error_response('This outpass cannot be cancelled.')

        outpass.status = OutpassStatus.CANCELLED
        outpass.cancelled_at = timezone.now()
        outpass.cancelled_by = request.user
        outpass.save()

        AuditService.log(
            AuditAction.CANCELLATION, request.user, 'OutpassRequest', str(outpass.id),
            'Outpass cancelled by user', request=request
        )
        return success_response(message='Outpass cancelled successfully.')

    @extend_schema(summary='Revoke an approved outpass')
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def revoke(self, request, pk=None):
        outpass = self.get_object()
        if outpass.status != OutpassStatus.APPROVED:
            return error_response('Only approved outpasses can be revoked.')

        serializer = OutpassRevokeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        outpass.is_revoked = True
        outpass.revoke_reason = serializer.validated_data['reason']
        outpass.status = OutpassStatus.REJECTED
        outpass.save()

        AuditService.log(
            AuditAction.UPDATE, request.user, 'OutpassRequest', str(outpass.id),
            f'Outpass revoked: {serializer.validated_data["reason"]}', request=request
        )
        return success_response(message='Outpass revoked successfully.')

    @extend_schema(summary='Get pending outpasses for approval')
    @action(detail=False, methods=['get'])
    def pending_approvals(self, request):
        queryset = self.get_queryset().filter(
            status__in=[OutpassStatus.PENDING, OutpassStatus.FACULTY_APPROVED, OutpassStatus.HOD_APPROVED]
        ).order_by('-is_urgent', '-created_at')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = OutpassListSerializer(page, many=True)
            return success_response(data=serializer.data, meta={'count': queryset.count()})
        serializer = OutpassListSerializer(queryset, many=True)
        return success_response(data=serializer.data)

    @extend_schema(summary='Get my outpass history')
    @action(detail=False, methods=['get'])
    def my_history(self, request):
        try:
            student = StudentProfile.objects.get(user=request.user)
        except StudentProfile.DoesNotExist:
            return error_response('Student profile not found.', status_code=status.HTTP_404_NOT_FOUND)
        outpasses = OutpassRequest.objects.filter(student=student).order_by('-created_at')
        page = self.paginate_queryset(outpasses)
        serializer = OutpassListSerializer(page, many=True)
        return success_response(data=serializer.data, meta={'total': outpasses.count()})

    @extend_schema(summary='Get active outpasses')
    @action(detail=False, methods=['get'])
    def active(self, request):
        queryset = self.get_queryset().filter(
            status__in=[
                OutpassStatus.APPROVED, OutpassStatus.PENDING,
                OutpassStatus.FACULTY_APPROVED, OutpassStatus.HOD_APPROVED,
                OutpassStatus.WARDEN_APPROVED,
            ]
        ).order_by('-created_at')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = OutpassListSerializer(page, many=True)
            return success_response(data=serializer.data, meta={'count': queryset.count()})
        serializer = OutpassListSerializer(queryset, many=True)
        return success_response(data=serializer.data)
