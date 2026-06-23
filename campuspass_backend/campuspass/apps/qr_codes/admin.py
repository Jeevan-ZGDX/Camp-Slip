from django.contrib import admin
from .models import QRPass


@admin.register(QRPass)
class QRPassAdmin(admin.ModelAdmin):
    list_display = ['id', 'outpass', 'token_short', 'expires_at', 'is_revoked', 'verification_count']
    list_filter = ['is_revoked']
    search_fields = ['token', 'outpass__id']
    raw_id_fields = ['outpass']

    def token_short(self, obj):
        return obj.token[:20] + '...' if len(obj.token) > 20 else obj.token
    token_short.short_description = 'Token'
