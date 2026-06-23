from celery import shared_task
from .services import QRCodeService


@shared_task
def cleanup_expired_qr_codes():
    count = QRCodeService.cleanup_expired()
    return f'Cleaned up {count} expired QR codes'
