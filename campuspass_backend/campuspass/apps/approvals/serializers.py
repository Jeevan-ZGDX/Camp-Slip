from rest_framework import serializers
from .models import Approval, ApprovalConfiguration
from campuspass.apps.outpass.serializers import OutpassListSerializer


class ApprovalSerializer(serializers.ModelSerializer):
    approver_name = serializers.CharField(source='approver.get_full_name', read_only=True)
    approver_role = serializers.CharField(source='approver.get_role_display_name', read_only=True)
    outpass_details = OutpassListSerializer(source='outpass', read_only=True)

    class Meta:
        model = Approval
        fields = [
            'id', 'outpass', 'outpass_details', 'approver', 'approver_name',
            'approver_role', 'approval_level', 'action', 'comments',
            'ip_address', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'approver', 'created_at', 'updated_at']


class ApprovalActionSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['APPROVED', 'REJECTED'])
    comments = serializers.CharField(required=False, allow_blank=True, max_length=1000)

    def validate_comments(self, value):
        action = self.initial_data.get('action')
        if action == 'REJECTED' and not value:
            raise serializers.ValidationError('Comments are required when rejecting.')
        return value


class ApprovalConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApprovalConfiguration
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
