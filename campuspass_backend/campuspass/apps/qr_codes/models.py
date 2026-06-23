import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from campuspass.apps.outpass.models import OutpassRequest
from campuspass.common.utils import get_qr_expiry


class QRPass(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    outpass = models.OneToOneField(
        OutpassRequest, on_delete=models.CASCADE,
        related_name='qr_pass',
    )
    token = models.CharField(max_length=255, unique=True, db_index=True)
    qr_image = models.ImageField(upload_to='qr_codes/', null=True, blank=True)
    expires_at = models.DateTimeField()
    is_revoked = models.BooleanField(default=False)
    revoked_at = models.DateTimeField(null=True, blank=True)
    revoked_reason = models.CharField(max_length=255, blank=True)
    verification_count = models.PositiveIntegerField(default=0)
    last_verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'qr_passes'
        verbose_name = 'QR Pass'
        verbose_name_plural = 'QR Passes'
        indexes = [
            models.Index(fields=['token', 'expires_at']),
            models.Index(fields=['outpass', 'is_revoked']),
        ]

    def __str__(self):
        return f'QR Pass for Outpass {self.outpass.id}'

    @property
    def is_expired(self):
        return self.expires_at < timezone.now()

    @property
    def is_valid(self):
        return (
            not self.is_revoked
            and not self.is_expired
            and self.outpass.status in ['APPROVED', 'WARDEN_APPROVED']
        )

    @property
    def time_remaining(self):
        if self.expires_at:
            remaining = self.expires_at - timezone.now()
            return max(0, remaining.total_seconds())
        return 0
