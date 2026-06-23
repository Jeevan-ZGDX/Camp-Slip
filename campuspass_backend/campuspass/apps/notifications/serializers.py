from rest_framework import serializers
from .models import Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    time_ago = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'recipient', 'notification_type', 'title', 'message',
            'is_read', 'read_at', 'related_object_id', 'related_object_type',
            'deep_link', 'priority', 'time_ago', 'created_at',
        ]
        read_only_fields = ['id', 'recipient', 'created_at']

    def get_time_ago(self, obj):
        from django.utils import timezone
        now = timezone.now()
        diff = now - obj.created_at
        if diff.days > 0:
            return f'{diff.days}d ago'
        if diff.seconds >= 3600:
            return f'{diff.seconds // 3600}h ago'
        if diff.seconds >= 60:
            return f'{diff.seconds // 60}m ago'
        return 'just now'


class NotificationMarkReadSerializer(serializers.Serializer):
    ids = serializers.ListField(child=serializers.UUIDField(), required=False)
    all = serializers.BooleanField(default=False)


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = [
            'id', 'email_notifications', 'push_notifications', 'sms_notifications',
            'outpass_updates', 'approval_requests', 'verification_updates',
            'system_updates', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
