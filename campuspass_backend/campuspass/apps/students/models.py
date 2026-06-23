import uuid
from django.db import models
from django.conf import settings
from campuspass.apps.departments.models import Department, Course, Hostel
from campuspass.common.enums import Gender


class StudentProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='student_profile',
    )
    student_id = models.CharField(max_length=50, unique=True, db_index=True, verbose_name='Student ID')
    enrollment_number = models.CharField(max_length=50, unique=True, db_index=True)
    department = models.ForeignKey(
        Department, on_delete=models.SET_NULL, null=True,
        related_name='student_profiles'
    )
    course = models.ForeignKey(
        Course, on_delete=models.SET_NULL, null=True,
        related_name='student_profiles'
    )
    current_year = models.PositiveSmallIntegerField(default=1)
    current_semester = models.PositiveSmallIntegerField(default=1)
    section = models.CharField(max_length=10, blank=True)
    batch = models.CharField(max_length=20, blank=True)
    hostel = models.ForeignKey(
        Hostel, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='student_profiles'
    )
    room_number = models.CharField(max_length=20, blank=True)
    parent_name = models.CharField(max_length=200, blank=True)
    parent_phone = models.CharField(max_length=20, blank=True)
    parent_email = models.EmailField(max_length=255, blank=True)
    emergency_contact = models.CharField(max_length=20, blank=True)
    permanent_address = models.TextField(blank=True)
    current_address = models.TextField(blank=True)
    is_in_hostel = models.BooleanField(default=True, db_index=True)
    is_active = models.BooleanField(default=True, db_index=True)
    faculty_advisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='advised_students',
        limit_choices_to={'role': 'FACULTY'},
    )
    additional_info = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'student_profiles'
        verbose_name = 'Student Profile'
        verbose_name_plural = 'Student Profiles'
        indexes = [
            models.Index(fields=['student_id', 'is_active']),
            models.Index(fields=['enrollment_number']),
            models.Index(fields=['department', 'course']),
            models.Index(fields=['batch', 'current_year']),
            models.Index(fields=['faculty_advisor']),
            models.Index(fields=['hostel', 'is_in_hostel']),
        ]

    def __str__(self):
        return f'{self.user.get_full_name} ({self.student_id})'

    @property
    def full_name(self):
        return self.user.get_full_name

    @property
    def email(self):
        return self.user.email

    @property
    def phone(self):
        return self.user.phone
