from django.contrib import admin
from .models import Department, Course, Hostel


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'hod', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'code']


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'department', 'duration_years', 'is_active']
    list_filter = ['is_active', 'department']
    search_fields = ['name', 'code', 'department__name']


@admin.register(Hostel)
class HostelAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'type', 'capacity', 'warden', 'is_active']
    list_filter = ['is_active', 'type']
    search_fields = ['name', 'code']
