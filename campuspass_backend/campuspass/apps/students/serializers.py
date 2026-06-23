from rest_framework import serializers
from django.conf import settings
from .models import StudentProfile
from campuspass.apps.authentication.serializers import UserSerializer


class StudentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    full_name = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    phone = serializers.CharField(read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True, default=None)
    course_name = serializers.CharField(source='course.name', read_only=True, default=None)
    hostel_name = serializers.CharField(source='hostel.name', read_only=True, default=None)
    faculty_advisor_name = serializers.CharField(
        source='faculty_advisor.get_full_name', read_only=True, default=None
    )

    class Meta:
        model = StudentProfile
        fields = [
            'id', 'user', 'student_id', 'enrollment_number',
            'full_name', 'email', 'phone',
            'department', 'department_name', 'course', 'course_name',
            'current_year', 'current_semester', 'section', 'batch',
            'hostel', 'hostel_name', 'room_number',
            'parent_name', 'parent_phone', 'parent_email', 'emergency_contact',
            'permanent_address', 'current_address',
            'is_in_hostel', 'is_active',
            'faculty_advisor', 'faculty_advisor_name',
            'additional_info', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class StudentProfileCreateSerializer(serializers.ModelSerializer):
    user_id = serializers.UUIDField()
    email = serializers.EmailField(write_only=True, required=False)
    first_name = serializers.CharField(write_only=True, required=False)
    last_name = serializers.CharField(write_only=True, required=False)
    phone = serializers.CharField(write_only=True, required=False)

    class Meta:
        model = StudentProfile
        fields = [
            'user_id', 'email', 'first_name', 'last_name', 'phone',
            'student_id', 'enrollment_number',
            'department', 'course', 'current_year', 'current_semester',
            'section', 'batch', 'hostel', 'room_number',
            'parent_name', 'parent_phone', 'parent_email', 'emergency_contact',
            'permanent_address', 'current_address',
            'faculty_advisor', 'additional_info',
        ]

    def validate_user_id(self, value):
        try:
            user = settings.AUTH_USER_MODEL.objects.get(id=value, role='STUDENT')
        except settings.AUTH_USER_MODEL.DoesNotExist:
            raise serializers.ValidationError('Invalid student user ID.')
        if hasattr(user, 'student_profile'):
            raise serializers.ValidationError('Student profile already exists for this user.')
        return value

    def create(self, validated_data):
        validated_data.pop('email', None)
        validated_data.pop('first_name', None)
        validated_data.pop('last_name', None)
        validated_data.pop('phone', None)
        return super().create(validated_data)


class StudentProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = [
            'current_year', 'current_semester', 'section', 'batch',
            'hostel', 'room_number',
            'parent_name', 'parent_phone', 'parent_email', 'emergency_contact',
            'permanent_address', 'current_address',
            'is_in_hostel', 'additional_info',
        ]


class StudentListSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True, default=None)
    course_name = serializers.CharField(source='course.name', read_only=True, default=None)

    class Meta:
        model = StudentProfile
        fields = [
            'id', 'student_id', 'enrollment_number', 'full_name', 'email',
            'department_name', 'course_name', 'current_year', 'current_semester',
            'is_in_hostel', 'is_active', 'batch',
        ]
