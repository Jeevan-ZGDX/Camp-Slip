from django.utils import timezone
from .models import Notification, NotificationPreference
from campuspass.common.enums import NotificationType


class NotificationService:

    @staticmethod
    def send_notification(recipient, notification_type, title, message,
                          related_object_id='', related_object_type='',
                          deep_link='', priority='NORMAL', additional_data=None):
        notification = Notification.objects.create(
            recipient=recipient,
            notification_type=notification_type,
            title=title,
            message=message,
            related_object_id=str(related_object_id) if related_object_id else '',
            related_object_type=related_object_type,
            deep_link=deep_link,
            priority=priority,
            additional_data=additional_data or {},
        )

        NotificationService._send_push(notification)
        NotificationService._send_email(notification)
        NotificationService._send_sms(notification)

        return notification

    @staticmethod
    def notify_outpass_submitted(outpass):
        approvers = []
        if outpass.student.faculty_advisor:
            approvers.append(outpass.student.faculty_advisor)
        if outpass.student.department and outpass.student.department.hod:
            approvers.append(outpass.student.department.hod)
        if outpass.student.hostel and outpass.student.hostel.warden:
            approvers.append(outpass.student.hostel.warden)

        for approver in approvers:
            NotificationService.send_notification(
                recipient=approver,
                notification_type=NotificationType.OUTPASS_SUBMITTED,
                title='New Outpass Request',
                message=f'{outpass.student.user.get_full_name} has submitted a {outpass.outpass_type} outpass request.',
                related_object_id=str(outpass.id),
                related_object_type='OutpassRequest',
                deep_link=f'/approvals/{outpass.id}',
                priority='HIGH' if outpass.is_urgent else 'NORMAL',
            )

    @staticmethod
    def notify_outpass_approved(outpass):
        NotificationService.send_notification(
            recipient=outpass.student.user,
            notification_type=NotificationType.OUTPASS_APPROVED,
            title='Outpass Approved',
            message='Your outpass request has been approved. You can now view your QR pass.',
            related_object_id=str(outpass.id),
            related_object_type='OutpassRequest',
            deep_link=f'/outpass/{outpass.id}',
            priority='HIGH',
        )

    @staticmethod
    def notify_outpass_rejected(outpass, comments=''):
        NotificationService.send_notification(
            recipient=outpass.student.user,
            notification_type=NotificationType.OUTPASS_REJECTED,
            title='Outpass Rejected',
            message=f'Your outpass request has been rejected. Reason: {comments or "No reason provided."}',
            related_object_id=str(outpass.id),
            related_object_type='OutpassRequest',
            deep_link=f'/outpass/{outpass.id}',
            priority='HIGH',
        )

    @staticmethod
    def notify_qr_generated(outpass):
        NotificationService.send_notification(
            recipient=outpass.student.user,
            notification_type=NotificationType.QR_GENERATED,
            title='QR Pass Generated',
            message='Your QR pass is ready. Present it at the gate for verification.',
            related_object_id=str(outpass.id),
            related_object_type='OutpassRequest',
            deep_link=f'/outpass/{outpass.id}/qr',
            priority='HIGH',
        )

    @staticmethod
    def notify_student_exited(outpass, verified_by):
        NotificationService.send_notification(
            recipient=outpass.student.user,
            notification_type=NotificationType.STUDENT_EXITED,
            title='Exit Recorded',
            message='Your exit has been recorded. Remember to return before your outpass expires.',
            related_object_id=str(outpass.id),
            related_object_type='OutpassRequest',
            priority='NORMAL',
        )

    @staticmethod
    def notify_student_returned(outpass, verified_by):
        NotificationService.send_notification(
            recipient=outpass.student.user,
            notification_type=NotificationType.STUDENT_RETURNED,
            title='Entry Recorded',
            message='Your return has been recorded. Welcome back to campus!',
            related_object_id=str(outpass.id),
            related_object_type='OutpassRequest',
            priority='NORMAL',
        )

    @staticmethod
    def _send_push(notification):
        if not notification.push_sent and notification.recipient.fcm_token:
            try:
                # TODO: Implement FCM push notification
                notification.push_sent = True
                notification.save(update_fields=['push_sent'])
            except Exception:
                pass

    @staticmethod
    def _send_email(notification):
        if notification.recipient.email:
            try:
                # TODO: Implement email sending
                notification.email_sent = True
                notification.save(update_fields=['email_sent'])
            except Exception:
                pass

    @staticmethod
    def _send_sms(notification):
        if notification.recipient.phone:
            try:
                # TODO: Implement SMS sending via Twilio
                notification.sms_sent = True
                notification.save(update_fields=['sms_sent'])
            except Exception:
                pass

    @staticmethod
    def mark_as_read(notification_ids, user, mark_all=False):
        if mark_all:
            updated = Notification.objects.filter(
                recipient=user, is_read=False
            ).update(is_read=True, read_at=timezone.now())
            return updated

        updated = Notification.objects.filter(
            id__in=notification_ids, recipient=user
        ).update(is_read=True, read_at=timezone.now())
        return updated

    @staticmethod
    def get_unread_count(user):
        return Notification.objects.filter(recipient=user, is_read=False).count()

    @staticmethod
    def get_recent_notifications(user, limit=20):
        return Notification.objects.filter(recipient=user)[:limit]
