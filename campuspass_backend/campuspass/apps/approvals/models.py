import uuid
from django.db import models
from django.conf import settings
from campuspass.apps.outpass.models import OutpassRequest
from campuspass.common.enums import ApprovalAction


class Approval(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    outpass = models.ForeignKey(
        OutpassRequest, on_delete=models.CASCADE,
        related_name='approvals',
    )
    approver = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
        related_name='approvals_given',
    )
    approval_level = models.CharField(max_length=20, choices=[
        ('FACULTY', 'Faculty Advisor'),
        ('HOD', 'Head of Department'),
        ('WARDEN', 'Warden'),
        ('ADMIN', 'Administrator'),
    ])
    action = models.CharField(
        max_length=20,
        choices=ApprovalAction.choices,
        default=ApprovalAction.PENDING,
    )
    comments = models.TextField(blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'approvals'
        verbose_name = 'Approval'
        verbose_name_plural = 'Approvals'
        ordering = ['created_at']
        unique_together = [['outpass', 'approval_level']]
        indexes = [
            models.Index(fields=['outpass', 'approval_level']),
            models.Index(fields=['approver', 'action']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f'{self.approval_level} - {self.action} for Outpass {self.outpass.id}'


class ApprovalConfiguration(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    department = models.OneToOneField(
        'departments.Department', on_delete=models.CASCADE,
        related_name='approval_config',
        null=True, blank=True,
    )
    requires_faculty_approval = models.BooleanField(default=True)
    requires_hod_approval = models.BooleanField(default=True)
    requires_warden_approval = models.BooleanField(default=True)
    enable_emergency_fast_track = models.BooleanField(default=False)
    max_emergency_hours = models.PositiveIntegerField(default=6)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'approval_configurations'
        verbose_name = 'Approval Configuration'
        verbose_name_plural = 'Approval Configurations'

    def __str__(self):
        dept = self.department.name if self.department else 'Global'
        return f'Approval Config - {dept}'
