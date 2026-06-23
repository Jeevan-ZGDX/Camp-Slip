from celery import shared_task
from .services import OutpassService


@shared_task
def expire_outdated_outpasses():
    count = OutpassService.expire_outdated_outpasses()
    return f'Expired {count} outpasses'


@shared_task
def notify_outpass_created(outpass_id):
    from .models import OutpassRequest
    from campuspass.apps.notifications.services import NotificationService
    try:
        outpass = OutpassRequest.objects.get(id=outpass_id)
        NotificationService.send_notification(
            recipient=outpass.student.faculty_advisor,
            notification_type='OUTPASS_SUBMITTED',
            title='New Outpass Request',
            message=f'{outpass.student.user.get_full_name} has submitted an outpass request.',
            related_object_id=str(outpass.id),
            related_object_type='OutpassRequest',
        )
    except OutpassRequest.DoesNotExist:
        pass
