from rest_framework import serializers
from .models import Department, Course, Hostel


class DepartmentSerializer(serializers.ModelSerializer):
    course_count = serializers.SerializerMethodField()
    student_count = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = [
            'id', 'name', 'code', 'description', 'hod', 'faculty',
            'is_active', 'course_count', 'student_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_course_count(self, obj):
        return obj.courses.filter(is_active=True).count()

    def get_student_count(self, obj):
        return obj.student_profiles.filter(is_active=True).count()


class DepartmentListSerializer(serializers.ModelSerializer):
    hod_name = serializers.CharField(source='hod.get_full_name', read_only=True, default=None)

    class Meta:
        model = Department
        fields = ['id', 'name', 'code', 'hod_name', 'is_active']


class CourseSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source='department.name', read_only=True)
    department_code = serializers.CharField(source='department.code', read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 'department', 'department_name', 'department_code',
            'name', 'code', 'duration_years', 'is_active',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CourseListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['id', 'name', 'code', 'department', 'duration_years', 'is_active']


class HostelSerializer(serializers.ModelSerializer):
    warden_name = serializers.CharField(source='warden.get_full_name', read_only=True, default=None)
    current_occupancy = serializers.SerializerMethodField()

    class Meta:
        model = Hostel
        fields = [
            'id', 'name', 'code', 'type', 'capacity', 'warden', 'warden_name',
            'address', 'is_active', 'current_occupancy', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_current_occupancy(self, obj):
        from campuspass.apps.students.models import StudentProfile
        return StudentProfile.objects.filter(
            hostel=obj, is_active=True, is_in_hostel=True
        ).count()
