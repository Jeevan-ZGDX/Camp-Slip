from rest_framework import serializers
from .models import EntryExitLog, MovementHistory
from campuspass.apps.outpass.serializers import OutpassListSerializer


class EntryExitLogSerializer(serializers.ModelSerializer):
    outpass_details = OutpassListSerializer(source='outpass', read_only=True)
    verified_by_name = serializers.CharField(source='verified_by.get_full_name', read_only=True, default=None)
    movement_type_display = serializers.CharField(source='get_movement_type_display', read_only=True)

    class Meta:
        model = EntryExitLog
        fields = [
            'id', 'outpass', 'outpass_details', 'movement_type',
            'movement_type_display', 'verified_by', 'verified_by_name',
            'verification_result', 'ip_address', 'location',
            'device_info', 'remarks', 'exit_time', 'entry_time', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class MovementHistorySerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.get_full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)

    class Meta:
        model = MovementHistory
        fields = [
            'id', 'student', 'student_name', 'student_id',
            'outpass', 'exit_time', 'entry_time',
            'total_hours', 'verified_by_exit', 'verified_by_entry',
            'status', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class VerifyExitSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)
    location = serializers.CharField(required=False, allow_blank=True, max_length=200)
    device_info = serializers.CharField(required=False, allow_blank=True, max_length=255)


class VerifyEntrySerializer(serializers.Serializer):
    token = serializers.CharField(required=True)
    location = serializers.CharField(required=False, allow_blank=True, max_length=200)
    device_info = serializers.CharField(required=False, allow_blank=True, max_length=255)
