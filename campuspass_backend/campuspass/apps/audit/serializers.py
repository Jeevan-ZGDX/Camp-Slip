from rest_framework import serializers
from .models import AuditLog, AuditLogArchive


class AuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.get_full_name', read_only=True, default=None)
    actor_email = serializers.EmailField(source='actor.email', read_only=True, default=None)
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'timestamp', 'actor', 'actor_name', 'actor_email',
            'action', 'action_display', 'resource_type', 'resource_id',
            'description', 'ip_address', 'user_agent',
            'request_method', 'request_path', 'response_status',
            'is_error', 'error_message', 'duration_ms',
        ]
        read_only_fields = fields


class AuditLogDetailSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source='actor.get_full_name', read_only=True, default=None)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    changes = serializers.JSONField()

    class Meta:
        model = AuditLog
        fields = '__all__'
        read_only_fields = [
            'id', 'timestamp', 'actor', 'action', 'resource_type',
            'resource_id', 'description', 'ip_address', 'user_agent',
            'request_method', 'request_path', 'response_status',
            'is_error', 'error_message', 'duration_ms', 'changes',
        ]
