from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema
from .models import Notification, NotificationPreference
from .serializers import (
    NotificationSerializer, NotificationMarkReadSerializer,
    NotificationPreferenceSerializer,
)
from .services import NotificationService
from campuspass.common.responses import success_response, error_response
from campuspass.common.pagination import PaginatedResponseMixin


@extend_schema(tags=['Notifications'])
class NotificationViewSet(viewsets.ReadOnlyModelViewSet, PaginatedResponseMixin):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

    @extend_schema(summary='List my notifications')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(summary='Get notification details')
    def retrieve(self, request, *args, **kwargs):
        notification = self.get_object()
        if not notification.is_read:
            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save(update_fields=['is_read', 'read_at'])
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(summary='Get unread notification count')
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = NotificationService.get_unread_count(request.user)
        return success_response(data={'count': count})

    @extend_schema(summary='Mark notifications as read')
    @action(detail=False, methods=['post'])
    def mark_read(self, request):
        serializer = NotificationMarkReadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        count = NotificationService.mark_as_read(
            notification_ids=serializer.validated_data.get('ids', []),
            user=request.user,
            mark_all=serializer.validated_data.get('all', False),
        )
        return success_response(data={'updated': count}, message=f'{count} notifications marked as read')

    @extend_schema(summary='Mark single notification as read')
    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save(update_fields=['is_read', 'read_at'])
        return success_response(message='Notification marked as read')


@extend_schema(tags=['Notifications'])
class NotificationPreferenceViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return NotificationPreference.objects.filter(user=self.request.user)

    def get_object(self):
        pref, created = NotificationPreference.objects.get_or_create(user=self.request.user)
        return pref

    @extend_schema(summary='Get my notification preferences')
    def list(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return success_response(data=serializer.data)

    @extend_schema(summary='Update notification preferences')
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(data=serializer.data, message='Preferences updated')

    @extend_schema(summary='Partially update notification preferences')
    def partial_update(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)
