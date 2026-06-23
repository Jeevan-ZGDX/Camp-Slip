from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, OpenApiParameter
from .models import AuditLog
from .serializers import AuditLogSerializer, AuditLogDetailSerializer
from .services import AuditService
from campuspass.common.enums import UserRole
from campuspass.common.permissions import IsAdmin
from campuspass.common.responses import success_response
from campuspass.common.pagination import PaginatedResponseMixin


@extend_schema(tags=['Audit'])
class AuditLogViewSet(viewsets.ReadOnlyModelViewSet, PaginatedResponseMixin):
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = {
        'action': ['exact', 'in'],
        'resource_type': ['exact'],
        'actor': ['exact'],
        'is_error': ['exact'],
        'timestamp': ['gte', 'lte', 'date'],
        'response_status': ['exact'],
    }
    search_fields = ['description', 'resource_id', 'ip_address', 'error_message']
    ordering_fields = ['timestamp', 'action']
    ordering = ['-timestamp']

    def get_queryset(self):
        return AuditLog.objects.select_related('actor').all()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AuditLogDetailSerializer
        return AuditLogSerializer

    @extend_schema(summary='List audit logs', parameters=[
        OpenApiParameter(name='action', description='Filter by action type', required=False, type=str),
        OpenApiParameter(name='resource_type', description='Filter by resource type', required=False, type=str),
        OpenApiParameter(name='is_error', description='Show only errors', required=False, type=bool),
        OpenApiParameter(name='search', description='Search in description', required=False, type=str),
    ])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(summary='Get audit log details')
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(summary='Get recent system activity')
    @action(detail=False, methods=['get'])
    def recent(self, request):
        limit = int(request.query_params.get('limit', 50))
        logs = AuditService.get_recent_activity(limit)
        serializer = self.get_serializer(logs, many=True)
        return success_response(data=serializer.data)

    @extend_schema(summary='Get error logs')
    @action(detail=False, methods=['get'])
    def errors(self, request):
        days = int(request.query_params.get('days', 7))
        logs = AuditService.get_error_logs(days)
        page = self.paginate_queryset(logs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return success_response(data=serializer.data, meta={'total': logs.count()})
        serializer = self.get_serializer(logs, many=True)
        return success_response(data=serializer.data)

    @extend_schema(summary='Get logs for specific resource')
    @action(detail=False, methods=['get'])
    def resource_logs(self, request):
        resource_type = request.query_params.get('resource_type')
        resource_id = request.query_params.get('resource_id')
        if not resource_type or not resource_id:
            return Response({'error': 'resource_type and resource_id are required'}, status=400)
        logs = AuditService.get_entity_logs(resource_type, resource_id)
        serializer = self.get_serializer(logs, many=True)
        return success_response(data=serializer.data)

    @extend_schema(summary='Get user activity logs')
    @action(detail=False, methods=['get'])
    def user_activity(self, request):
        user_id = request.query_params.get('user_id', request.user.id)
        logs = AuditService.get_user_activity(user_id)
        serializer = self.get_serializer(logs, many=True)
        return success_response(data=serializer.data)

    @extend_schema(summary='Get action summary statistics')
    @action(detail=False, methods=['get'])
    def summary(self, request):
        days = int(request.query_params.get('days', 7))
        summary = AuditService.get_action_summary(days)
        return success_response(data=list(summary))

    @extend_schema(summary='Get user login history')
    @action(detail=False, methods=['get'])
    def login_history(self, request):
        user_id = request.query_params.get('user_id', request.user.id)
        logs = AuditLog.objects.filter(
            actor_id=user_id,
            action__in=['LOGIN', 'LOGOUT'],
        ).order_by('-timestamp')[:50]
        serializer = self.get_serializer(logs, many=True)
        return success_response(data=serializer.data)
