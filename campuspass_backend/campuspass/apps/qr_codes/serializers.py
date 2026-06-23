from rest_framework import serializers
from .models import QRPass


class QRPassSerializer(serializers.ModelSerializer):
    outpass_id = serializers.UUIDField(source='outpass.id', read_only=True)
    is_valid = serializers.BooleanField(read_only=True)
    is_expired = serializers.BooleanField(read_only=True)
    time_remaining_seconds = serializers.SerializerMethodField()

    class Meta:
        model = QRPass
        fields = [
            'id', 'outpass_id', 'token', 'qr_image', 'expires_at',
            'is_revoked', 'is_valid', 'is_expired', 'time_remaining_seconds',
            'verification_count', 'last_verified_at', 'created_at',
        ]
        read_only_fields = [
            'id', 'token', 'qr_image', 'expires_at', 'is_revoked',
            'verification_count', 'last_verified_at', 'created_at',
        ]

    def get_time_remaining_seconds(self, obj):
        return obj.time_remaining


class QRVerifyRequestSerializer(serializers.Serializer):
    token = serializers.CharField(required=True, max_length=255)


class QRVerifyResponseSerializer(serializers.Serializer):
    result = serializers.CharField()
    message = serializers.CharField()
    data = serializers.DictField(required=False)
