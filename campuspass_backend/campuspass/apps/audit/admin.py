from django.contrib import admin
from .models import AuditLog, AuditLogArchive


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ['timestamp', 'actor', 'action', 'resource_type', 'resource_id', 'is_error']
    list_filter = ['action', 'is_error', 'resource_type']
    search_fields = ['actor__email', 'description', 'resource_id', 'ip_address']
    date_hierarchy = 'timestamp'
    readonly_fields = [f.name for f in AuditLog._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return request.user.is_superuser


@admin.register(AuditLogArchive)
class AuditLogArchiveAdmin(admin.ModelAdmin):
    list_display = ['archived_at', 'timestamp', 'action', 'actor_email']
    list_filter = ['action']
    readonly_fields = [f.name for f in AuditLogArchive._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
