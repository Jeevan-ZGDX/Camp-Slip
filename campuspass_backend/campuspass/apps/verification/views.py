from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiParameter
from .models import EntryExitLog, MovementHistory
from .serializers import EntryExitLogSerializer, MovementHistorySerializer, VerifyExitSerializer, VerifyEntrySerializer
from .services import EntryExitService
from campuspass.common.enums import UserRole
from campuspass.common.permissions import IsSecurity, IsAdmin
from campuspass.common.responses import success_response, error_response
from campuspass.common.pagination import PaginatedResponseMixin


@extend_schema(tags=['Verification'])
class EntryExitLogViewSet(viewsets.ReadOnlyModelViewSet, PaginatedResponseMixin):
    queryset = EntryExitLog.objects.select_related(
        'outpass__student__user', 'verified_by'
    ).all()
    serializer_class = EntryExitLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['movement_type', 'verification_result', 'outpass']
    ordering_fields = ['created_at', 'exit_time', 'entry_time']

    def get_queryset(self):
        user = self.request.user
        if user.role in [UserRole.ADMIN, UserRole.SECURITY]:
            return self.queryset
        if user.role == UserRole.STUDENT:
            return self.queryset.filter(outpass__student__user=user)
        return self.queryset.filter(outpass__student__faculty_advisor=user)

    @extend_schema(summary='List entry/exit logs', parameters=[
        OpenApiParameter(name='movement_type', description='Filter by EXIT or ENTRY', required=False, type=str),
    ])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(summary='Get entry/exit log details')
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(summary='Record student exit via QR scan')
    @action(detail=False, methods=['post'], permission_classes=[IsSecurity])
    def record_exit(self, request):
        serializer = VerifyExitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = EntryExitService.verify_and_record_exit(
            token=serializer.validated_data['token'],
            verified_by=request.user,
            request=request,
        )

        if result['status'] != 'success':
            return error_response(result['message'], status_code=status.HTTP_400_BAD_REQUEST)

        return success_response(data=result['data'], message=result['message'])

    @extend_schema(summary='Record student entry via QR scan')
    @action(detail=False, methods=['post'], permission_classes=[IsSecurity])
    def record_entry(self, request):
        serializer = VerifyEntrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        result = EntryExitService.verify_and_record_entry(
            token=serializer.validated_data['token'],
            verified_by=request.user,
            request=request,
        )

        if result['status'] != 'success':
            return error_response(result['message'], status_code=status.HTTP_400_BAD_REQUEST)

        return success_response(data=result['data'], message=result['message'])

    @extend_schema(summary='Bulk verify multiple QR tokens')
    @action(detail=False, methods=['post'], permission_classes=[IsSecurity])
    def bulk_verify(self, request):
        tokens = request.data.get('tokens', [])
        movement_type = request.data.get('movement_type', 'EXIT')

        if not tokens:
            return error_response('No tokens provided.')

        results = []
        for token in tokens:
            if movement_type == 'EXIT':
                result = EntryExitService.verify_and_record_exit(token, request.user, request)
            else:
                result = EntryExitService.verify_and_record_entry(token, request.user, request)
            results.append({
                'token': token[:20],
                'success': result['status'] == 'success',
                'message': result['message'],
            })

        return success_response(data={'results': results}, message=f'Processed {len(results)} verifications')


@extend_schema(tags=['Verification'])
class MovementHistoryViewSet(viewsets.ReadOnlyModelViewSet, PaginatedResponseMixin):
    queryset = MovementHistory.objects.select_related(
        'student__user', 'verified_by_exit', 'verified_by_entry', 'outpass'
    ).all()
    serializer_class = MovementHistorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'student']
    ordering_fields = ['exit_time', 'entry_time']

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.STUDENT:
            return self.queryset.filter(student__user=user)
        if user.role == UserRole.FACULTY:
            return self.queryset.filter(student__faculty_advisor=user)
        if user.role == UserRole.WARDEN:
            return self.queryset.filter(student__hostel__warden=user)
        return self.queryset

    @extend_schema(summary='List movement history', parameters=[
        OpenApiParameter(name='status', description='Filter by OUTSIDE, RETURNED, OVERSTAY', required=False, type=str),
    ])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(summary='Get movement history details')
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(summary='Get currently outside students')
    @action(detail=False, methods=['get'])
    def outside_campus(self, request):
        queryset = self.get_queryset().filter(status='OUTSIDE').order_by('-exit_time')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return success_response(data=serializer.data, meta={'count': self.get_queryset().filter(status='OUTSIDE').count()})
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data)
