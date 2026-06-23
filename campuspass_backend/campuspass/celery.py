import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campuspass.settings')

app = Celery('campuspass')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
