import json
from .models import AuditLog
from campuspass.common.utils import get_client_ip, get_user_agent


class AuditService:

    @staticmethod
    def log(action, actor=None, resource_type='', resource_id='',
            description='', request=None, changes=None, is_error=False,
            error_message='', duration_ms=None, response_status=None):

        ip_address = None
        user_agent = ''
        request_method = ''
        request_path = ''

        if request:
            ip_address = get_client_ip(request)
            user_agent = get_user_agent(request)
            request_method = request.method
            request_path = request.path

        return AuditLog.objects.create(
            actor=actor,
            action=action,
            resource_type=resource_type,
            resource_id=str(resource_id) if resource_id else '',
            description=description,
            ip_address=ip_address,
            user_agent=user_agent,
            request_method=request_method,
            request_path=request_path,
            changes=changes or {},
            is_error=is_error,
            error_message=error_message,
            duration_ms=duration_ms,
            response_status=response_status,
        )

    @staticmethod
    def get_recent_activity(limit=50):
        return AuditLog.objects.select_related('actor').all()[:limit]

    @staticmethod
    def get_entity_logs(resource_type, resource_id):
        return AuditLog.objects.filter(
            resource_type=resource_type, resource_id=str(resource_id)
        ).order_by('-timestamp')

    @staticmethod
    def get_user_activity(user_id):
        return AuditLog.objects.filter(actor_id=user_id).order_by('-timestamp')[:100]

    @staticmethod
    def get_action_summary(days=7):
        from django.utils import timezone
        from datetime import timedelta
        cutoff = timezone.now() - timedelta(days=days)
        return AuditLog.objects.filter(timestamp__gte=cutoff).values('action').annotate(
            count=models.Count('id')
        ).order_by('-count')

    @staticmethod
    def get_error_logs(days=7):
        from django.utils import timezone
        from datetime import timedelta
        cutoff = timezone.now() - timedelta(days=days)
        return AuditLog.objects.filter(is_error=True, timestamp__gte=cutoff).order_by('-timestamp')


from django.db import models
