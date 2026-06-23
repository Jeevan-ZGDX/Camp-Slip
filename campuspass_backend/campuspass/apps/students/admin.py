from django.contrib import admin
from .models import StudentProfile


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ['student_id', 'user', 'department', 'course', 'batch', 'is_in_hostel', 'is_active']
    list_filter = ['is_active', 'is_in_hostel', 'department', 'batch']
    search_fields = ['student_id', 'enrollment_number', 'user__email', 'user__first_name', 'user__last_name']
    raw_id_fields = ['user']
    autocomplete_fields = ['department', 'course', 'hostel', 'faculty_advisor']
