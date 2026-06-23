from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from .models import QRPass
from .serializers import QRPassSerializer, QRVerifyRequestSerializer
from .services import QRCodeService
from campuspass.common.enums import AuditAction, UserRole
from campuspass.common.responses import success_response, error_response
from campuspass.common.pagination import PaginatedResponseMixin
from campuspass.apps.audit.services import AuditService


@extend_schema(tags=['QR Codes'])
class QRPassViewSet(viewsets.ReadOnlyModelViewSet, PaginatedResponseMixin):
    queryset = QRPass.objects.select_related(
        'outpass__student__user',
        'outpass__student__department',
    ).all()
    serializer_class = QRPassSerializer
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['is_revoked']
    ordering_fields = ['created_at']

    def get_queryset(self):
        user = self.request.user
        if user.role == UserRole.STUDENT:
            return self.queryset.filter(outpass__student__user=user)
        if user.role in [UserRole.ADMIN, UserRole.WARDEN, UserRole.SECURITY]:
            return self.queryset
        return self.queryset.filter(outpass__student__faculty_advisor=user)

    @extend_schema(summary='List QR passes')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(summary='Get QR pass details')
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(summary='Regenerate QR pass')
    @action(detail=True, methods=['post'])
    def regenerate(self, request, pk=None):
        qr_pass = self.get_object()
        if qr_pass.outpass.status not in ['APPROVED', 'WARDEN_APPROVED']:
            return error_response('Outpass is not approved.')

        QRCodeService.revoke_qr_pass(qr_pass, reason='Regenerated', request=request)
        new_qr = QRCodeService.generate_qr_for_outpass(qr_pass.outpass, request=request)
        serializer = self.get_serializer(new_qr)

        AuditService.log(
            AuditAction.QR_GENERATE, request.user, 'QRPass', str(new_qr.id),
            'QR regenerated', request=request
        )
        return success_response(data=serializer.data, message='QR regenerated successfully')

    @extend_schema(summary='Revoke QR pass')
    @action(detail=True, methods=['post'])
    def revoke(self, request, pk=None):
        qr_pass = self.get_object()
        reason = request.data.get('reason', 'Revoked by user')
        QRCodeService.revoke_qr_pass(qr_pass, reason=reason, request=request)
        return success_response(message='QR pass revoked successfully')

    @extend_schema(summary='Get full QR pass data for verification')
    @action(detail=False, methods=['post'])
    def verify(self, request):
        serializer = QRVerifyRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data['token']
        qr_pass, result_code, message = QRCodeService.verify_qr_token(token)

        AuditService.log(
            AuditAction.QR_VERIFY, request.user, 'QRPass', token[:20],
            f'QR verification result: {result_code}', request=request
        )

        if result_code != 'VALID':
            return success_response(
                data={'result': result_code, 'message': message},
                message=message,
            )

        full_data = QRCodeService.get_qr_data(qr_pass)
        return success_response(
            data={
                'result': 'VALID',
                'message': 'QR verified successfully',
                'pass_data': full_data,
            }
        )

    @extend_schema(summary='Verify and record exit (internal use)')
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def verify_and_exit(self, request):
        serializer = QRVerifyRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from campuspass.apps.verification.services import EntryExitService
        result = EntryExitService.verify_and_record_exit(
            token=serializer.validated_data['token'],
            verified_by=request.user,
            request=request,
        )

        if result['status'] != 'success':
            return error_response(result['message'])

        return success_response(data=result['data'], message=result['message'])

    @extend_schema(summary='Verify and record entry (internal use)')
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def verify_and_entry(self, request):
        serializer = QRVerifyRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        from campuspass.apps.verification.services import EntryExitService
        result = EntryExitService.verify_and_record_entry(
            token=serializer.validated_data['token'],
            verified_by=request.user,
            request=request,
        )

        if result['status'] != 'success':
            return error_response(result['message'])

        return success_response(data=result['data'], message=result['message'])
