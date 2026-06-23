import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from campuspass.common.enums import OutpassStatus
from campuspass.apps.students.models import StudentProfile


class OutpassRequest(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        StudentProfile, on_delete=models.CASCADE,
        related_name='outpass_requests',
    )
    outpass_type = models.CharField(max_length=50, default='GENERAL', choices=[
        ('GENERAL', 'General'),
        ('MEDICAL', 'Medical'),
        ('EMERGENCY', 'Emergency'),
        ('HOME', 'Home Visit'),
        ('OTHER', 'Other'),
    ])
    reason = models.TextField()
    destination = models.CharField(max_length=500)
    departure_datetime = models.DateTimeField()
    expected_return_datetime = models.DateTimeField()
    actual_return_datetime = models.DateTimeField(null=True, blank=True)
    duration_hours = models.PositiveIntegerField(default=4)
    status = models.CharField(
        max_length=20,
        choices=OutpassStatus.choices,
        default=OutpassStatus.PENDING,
        db_index=True,
    )
    remarks = models.TextField(blank=True)
    is_urgent = models.BooleanField(default=False)
    requires_faculty_approval = models.BooleanField(default=True)
    requires_hod_approval = models.BooleanField(default=True)
    requires_warden_approval = models.BooleanField(default=True)

    # Tracking
    current_approval_level = models.CharField(max_length=20, default='FACULTY')
    is_revoked = models.BooleanField(default=False)
    revoke_reason = models.TextField(blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancelled_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='cancelled_outpasses',
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'outpass_requests'
        verbose_name = 'Outpass Request'
        verbose_name_plural = 'Outpass Requests'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['student', 'status']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['departure_datetime', 'expected_return_datetime']),
            models.Index(fields=['status', 'current_approval_level']),
            models.Index(fields=['student', 'departure_datetime']),
        ]

    def __str__(self):
        return f'Outpass {self.id} - {self.student.user.get_full_name} ({self.status})'

    @property
    def is_approved(self):
        return self.status == OutpassStatus.APPROVED

    @property
    def is_pending(self):
        return self.status in [
            OutpassStatus.PENDING,
            OutpassStatus.FACULTY_APPROVED,
            OutpassStatus.HOD_APPROVED,
            OutpassStatus.WARDEN_APPROVED,
        ]

    @property
    def is_expired(self):
        if self.expected_return_datetime and self.expected_return_datetime < timezone.now():
            return True
        return False

    @property
    def time_remaining(self):
        if self.expected_return_datetime:
            remaining = self.expected_return_datetime - timezone.now()
            return max(0, remaining.total_seconds())
        return 0

    def save(self, *args, **kwargs):
        if self.departure_datetime and self.expected_return_datetime:
            delta = self.expected_return_datetime - self.departure_datetime
            self.duration_hours = max(1, int(delta.total_seconds() / 3600))
        super().save(*args, **kwargs)
