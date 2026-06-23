import uuid
from django.db import models
from django.conf import settings
from campuspass.common.enums import HostelType


class Department(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200, unique=True)
    code = models.CharField(max_length=20, unique=True, db_index=True)
    description = models.TextField(blank=True)
    hod = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='hod_department',
        limit_choices_to={'role': 'HOD'},
    )
    faculty = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name='faculty_departments',
        limit_choices_to={'role': 'FACULTY'},
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'departments'
        verbose_name = 'Department'
        verbose_name_plural = 'Departments'
        ordering = ['name']
        indexes = [
            models.Index(fields=['code', 'is_active']),
        ]

    def __str__(self):
        return f'{self.name} ({self.code})'


class Course(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    department = models.ForeignKey(
        Department, on_delete=models.CASCADE, related_name='courses'
    )
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, db_index=True)
    duration_years = models.PositiveSmallIntegerField(default=4)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'courses'
        verbose_name = 'Course'
        verbose_name_plural = 'Courses'
        unique_together = ['department', 'code']
        ordering = ['name']
        indexes = [
            models.Index(fields=['code', 'is_active']),
        ]

    def __str__(self):
        return f'{self.name} - {self.department.code}'


class Hostel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True, db_index=True)
    type = models.CharField(max_length=10, choices=HostelType.choices, default=HostelType.CO_ED)
    capacity = models.PositiveIntegerField(default=100)
    warden = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='warden_hostel',
        limit_choices_to={'role': 'WARDEN'},
    )
    address = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hostels'
        verbose_name = 'Hostel'
        verbose_name_plural = 'Hostels'
        ordering = ['name']

    def __str__(self):
        return f'{self.name} ({self.code})'
