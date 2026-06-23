import time
import json
from django.utils.deprecation import MiddlewareMixin
from campuspass.common.utils import get_client_ip, get_user_agent


class AuditLogMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request.audit_data = {
            'ip_address': get_client_ip(request),
            'user_agent': get_user_agent(request),
            'path': request.path,
            'method': request.method,
        }
        if request.method in ('POST', 'PUT', 'PATCH') and request.content_type == 'application/json':
            try:
                request.audit_data['body'] = json.dumps(request.body.decode('utf-8'))[:1000]
            except (UnicodeDecodeError, AttributeError):
                request.audit_data['body'] = ''


class RequestTimingMiddleware(MiddlewareMixin):
    def process_request(self, request):
        request._start_time = time.time()

    def process_response(self, request, response):
        if hasattr(request, '_start_time'):
            duration = time.time() - request._start_time
            response['X-Request-Duration-Ms'] = str(round(duration * 1000, 2))
        return response
