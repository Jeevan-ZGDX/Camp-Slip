from django.contrib import admin
from .models import Approval, ApprovalConfiguration


@admin.register(Approval)
class ApprovalAdmin(admin.ModelAdmin):
    list_display = ['outpass', 'approver', 'approval_level', 'action', 'created_at']
    list_filter = ['action', 'approval_level']
    search_fields = ['outpass__id', 'approver__email', 'comments']
    raw_id_fields = ['outpass', 'approver']


@admin.register(ApprovalConfiguration)
class ApprovalConfigurationAdmin(admin.ModelAdmin):
    list_display = ['department', 'requires_faculty_approval', 'requires_hod_approval', 'requires_warden_approval']
