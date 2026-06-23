from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from .models import Approval, ApprovalConfiguration
from .serializers import (
    ApprovalSerializer, ApprovalActionSerializer, ApprovalConfigurationSerializer,
)
from .services import ApprovalService
from campuspass.common.enums import AuditAction, UserRole
from campuspass.common.permissions import IsApprover, IsAdmin
from campuspass.common.responses import success_response, created_response, error_response
from campuspass.common.pagination import PaginatedResponseMixin
from campuspass.apps.audit.services import AuditService
from campuspass.apps.outpass.models import OutpassRequest
from campuspass.apps.outpass.serializers import OutpassListSerializer


@extend_schema(tags=['Approvals'])
class ApprovalViewSet(viewsets.ReadOnlyModelViewSet, PaginatedResponseMixin):
    queryset = Approval.objects.select_related(
        'outpass__student__user', 'approver'
    ).all()
    serializer_class = ApprovalSerializer
    permission_classes = [permissions.IsAuthenticated, IsApprover]
    filterset_fields = ['action', 'approval_level', 'outpass']
    ordering_fields = ['created_at']

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.ADMIN:
            return self.queryset
        return self.queryset.filter(approver=user)

    @extend_schema(summary='List approvals')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(summary='Get approval details')
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(summary='Approve or reject an outpass')
    @action(detail=False, methods=['post'])
    def act(self, request):
        serializer = ApprovalActionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        outpass_id = request.data.get('outpass_id')
        if not outpass_id:
            return error_response('outpass_id is required.')

        approval, message = ApprovalService.process_approval(
            outpass_id=outpass_id,
            approver=request.user,
            action=serializer.validated_data['action'],
            comments=serializer.validated_data.get('comments', ''),
            request=request,
        )

        if approval is None:
            return error_response(message, status_code=status.HTTP_400_BAD_REQUEST)

        outpass = OutpassRequest.objects.get(id=outpass_id)
        return success_response(
            data={
                'approval': ApprovalSerializer(approval).data,
                'outpass': OutpassListSerializer(outpass).data,
            },
            message=message,
        )

    @extend_schema(summary='Get pending approvals for current user')
    @action(detail=False, methods=['get'])
    def pending(self, request):
        queryset = ApprovalService.get_pending_approvals_for_user(request.user)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = OutpassListSerializer(page, many=True)
            return success_response(
                data=serializer.data,
                meta={'total_pending': queryset.count()},
            )
        serializer = OutpassListSerializer(queryset, many=True)
        return success_response(data=serializer.data)

    @extend_schema(summary='Get approval history for an outpass')
    @action(detail=False, methods=['get'])
    def history(self, request):
        outpass_id = request.query_params.get('outpass_id')
        if not outpass_id:
            return error_response('outpass_id query parameter is required.')

        approvals = ApprovalService.get_approval_history(outpass_id)
        serializer = self.get_serializer(approvals, many=True)
        return success_response(data=serializer.data)

    @extend_schema(summary='Bulk approve pending outpasses')
    @action(detail=False, methods=['post'])
    def bulk_approve(self, request):
        outpass_ids = request.data.get('outpass_ids', [])
        comments = request.data.get('comments', '')
        action = request.data.get('action', 'APPROVED')

        if not outpass_ids:
            return error_response('No outpass IDs provided.')

        results = []
        for outpass_id in outpass_ids:
            approval, message = ApprovalService.process_approval(
                outpass_id=outpass_id,
                approver=request.user,
                action=action,
                comments=comments,
                request=request,
            )
            results.append({
                'outpass_id': outpass_id,
                'success': approval is not None,
                'message': message,
            })

        return success_response(data={'results': results}, message=f'Processed {len(results)} outpasses')


@extend_schema(tags=['Approvals'])
class ApprovalConfigurationViewSet(viewsets.ModelViewSet):
    queryset = ApprovalConfiguration.objects.all()
    serializer_class = ApprovalConfigurationSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    @extend_schema(summary='List approval configurations')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(summary='Update approval configuration')
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @extend_schema(summary='Partially update approval configuration')
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)
