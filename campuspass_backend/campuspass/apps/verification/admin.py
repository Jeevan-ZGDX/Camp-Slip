from django.contrib import admin
from .models import EntryExitLog, MovementHistory


@admin.register(EntryExitLog)
class EntryExitLogAdmin(admin.ModelAdmin):
    list_display = ['outpass', 'movement_type', 'verified_by', 'verification_result', 'exit_time', 'created_at']
    list_filter = ['movement_type', 'verification_result']
    search_fields = ['outpass__id', 'verified_by__email']
    raw_id_fields = ['outpass', 'verified_by']


@admin.register(MovementHistory)
class MovementHistoryAdmin(admin.ModelAdmin):
    list_display = ['student', 'status', 'exit_time', 'entry_time', 'total_hours']
    list_filter = ['status']
    search_fields = ['student__user__email', 'student__student_id']
    raw_id_fields = ['student', 'outpass', 'verified_by_exit', 'verified_by_entry']
