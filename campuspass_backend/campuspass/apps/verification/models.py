import uuid
from django.db import models
from django.conf import settings
from campuspass.apps.outpass.models import OutpassRequest
from campuspass.common.enums import MovementType, VerificationResult


class EntryExitLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    outpass = models.ForeignKey(
        OutpassRequest, on_delete=models.CASCADE,
        related_name='entry_exit_logs',
    )
    movement_type = models.CharField(
        max_length=10, choices=MovementType.choices, db_index=True
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='verifications',
    )
    verification_result = models.CharField(
        max_length=20, choices=VerificationResult.choices,
        default=VerificationResult.VALID,
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    location = models.CharField(max_length=200, blank=True)
    device_info = models.CharField(max_length=255, blank=True)
    remarks = models.TextField(blank=True)
    exit_time = models.DateTimeField(null=True, blank=True)
    entry_time = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'entry_exit_logs'
        verbose_name = 'Entry/Exit Log'
        verbose_name_plural = 'Entry/Exit Logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['outpass', 'movement_type']),
            models.Index(fields=['verified_by', 'created_at']),
            models.Index(fields=['exit_time', 'entry_time']),
        ]

    def __str__(self):
        return f'{self.movement_type} - Outpass {self.outpass.id}'


class MovementHistory(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(
        'students.StudentProfile', on_delete=models.CASCADE,
        related_name='movement_history',
    )
    outpass = models.ForeignKey(
        OutpassRequest, on_delete=models.CASCADE,
        related_name='movement_history',
    )
    exit_time = models.DateTimeField()
    entry_time = models.DateTimeField(null=True, blank=True)
    total_hours = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    verified_by_exit = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='exit_verifications',
    )
    verified_by_entry = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='entry_verifications',
    )
    status = models.CharField(max_length=20, default='OUTSIDE', choices=[
        ('OUTSIDE', 'Outside Campus'),
        ('RETURNED', 'Returned to Campus'),
        ('OVERSTAY', 'Overstayed'),
    ])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'movement_history'
        verbose_name = 'Movement History'
        verbose_name_plural = 'Movement Histories'
        ordering = ['-exit_time']
        indexes = [
            models.Index(fields=['student', 'status']),
            models.Index(fields=['exit_time', 'entry_time']),
        ]

    def __str__(self):
        return f'{self.student.user.get_full_name} - {self.status}'
