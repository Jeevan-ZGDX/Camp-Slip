from rest_framework import serializers
from django.utils import timezone
from .models import OutpassRequest
from campuspass.common.enums import OutpassStatus
from campuspass.apps.students.serializers import StudentListSerializer


class OutpassCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = OutpassRequest
        fields = [
            'outpass_type', 'reason', 'destination',
            'departure_datetime', 'expected_return_datetime',
            'is_urgent', 'remarks',
        ]

    def validate_departure_datetime(self, value):
        if value < timezone.now():
            raise serializers.ValidationError('Departure time cannot be in the past.')
        return value

    def validate_expected_return_datetime(self, value):
        departure = self.initial_data.get('departure_datetime')
        if isinstance(departure, str):
            from django.utils.dateparse import parse_datetime
            departure = parse_datetime(departure)

        if departure and value <= departure:
            raise serializers.ValidationError('Return time must be after departure time.')
        return value

    def validate(self, data):
        if data.get('expected_return_datetime') and data.get('departure_datetime'):
            delta = data['expected_return_datetime'] - data['departure_datetime']
            max_hours = 72
            if delta.total_seconds() > max_hours * 3600:
                raise serializers.ValidationError(
                    f'Outpass duration cannot exceed {max_hours} hours.'
                )
        return data


class OutpassSerializer(serializers.ModelSerializer):
    student = StudentListSerializer(read_only=True)
    student_id = serializers.UUIDField(write_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    time_remaining_seconds = serializers.SerializerMethodField()
    is_expired = serializers.BooleanField(read_only=True)
    is_pending = serializers.BooleanField(read_only=True)

    class Meta:
        model = OutpassRequest
        fields = [
            'id', 'student', 'student_id', 'outpass_type', 'reason',
            'destination', 'departure_datetime', 'expected_return_datetime',
            'actual_return_datetime', 'duration_hours', 'status', 'status_display',
            'is_urgent', 'remarks', 'is_pending', 'is_expired',
            'time_remaining_seconds', 'is_revoked', 'revoke_reason',
            'current_approval_level',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'student', 'status', 'duration_hours',
            'is_revoked', 'current_approval_level',
            'actual_return_datetime', 'cancelled_at',
            'created_at', 'updated_at',
        ]

    def get_time_remaining_seconds(self, obj):
        return obj.time_remaining


class OutpassListSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    student_image = serializers.ImageField(source='student.user.profile_image', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = OutpassRequest
        fields = [
            'id', 'student_name', 'student_id', 'student_image',
            'outpass_type', 'reason', 'destination',
            'departure_datetime', 'expected_return_datetime',
            'duration_hours', 'status', 'status_display',
            'is_urgent', 'is_revoked', 'current_approval_level',
            'created_at',
        ]


class OutpassStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[
        'FACULTY_APPROVED', 'HOD_APPROVED', 'WARDEN_APPROVED',
        'APPROVED', 'REJECTED', 'CANCELLED',
    ])
    remarks = serializers.CharField(required=False, allow_blank=True)
    revoke_reason = serializers.CharField(required=False, allow_blank=True)


class OutpassRevokeSerializer(serializers.Serializer):
    reason = serializers.CharField(required=True)
