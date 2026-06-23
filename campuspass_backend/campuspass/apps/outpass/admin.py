from django.contrib import admin
from .models import OutpassRequest


@admin.register(OutpassRequest)
class OutpassRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'student', 'outpass_type', 'status', 'is_urgent', 'is_revoked', 'created_at']
    list_filter = ['status', 'outpass_type', 'is_urgent', 'is_revoked']
    search_fields = ['student__user__email', 'student__student_id', 'reason', 'destination']
    date_hierarchy = 'created_at'
    raw_id_fields = ['student', 'cancelled_by']
