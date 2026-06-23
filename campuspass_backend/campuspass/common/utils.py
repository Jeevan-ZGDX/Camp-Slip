import uuid
from datetime import datetime, timedelta
from django.utils import timezone
from django.conf import settings


def generate_uuid_token():
    return str(uuid.uuid4())


def generate_short_id():
    return uuid.uuid4().hex[:12].upper()


def get_qr_expiry():
    return timezone.now() + timedelta(hours=settings.QR_CODE_EXPIRY_HOURS)


def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', 'unknown')


def get_user_agent(request):
    return request.META.get('HTTP_USER_AGENT', 'unknown')[:255]


def format_datetime(dt):
    if dt:
        return dt.strftime('%Y-%m-%dT%H:%M:%S%z')
    return None


def truncate_text(text, length=100):
    if text and len(text) > length:
        return text[:length] + '...'
    return text
