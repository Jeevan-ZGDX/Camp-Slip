from django.contrib import admin
from .models import Notification, NotificationPreference


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['recipient', 'notification_type', 'title', 'is_read', 'priority', 'created_at']
    list_filter = ['is_read', 'notification_type', 'priority']
    search_fields = ['recipient__email', 'title', 'message']
    raw_id_fields = ['recipient']


@admin.register(NotificationPreference)
class NotificationPreferenceAdmin(admin.ModelAdmin):
    list_display = ['user', 'email_notifications', 'push_notifications', 'sms_notifications']
    search_fields = ['user__email']
