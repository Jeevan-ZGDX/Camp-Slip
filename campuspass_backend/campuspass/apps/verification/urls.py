from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'logs', views.EntryExitLogViewSet, basename='entry-exit-log')
router.register(r'movements', views.MovementHistoryViewSet, basename='movement-history')

urlpatterns = [
    path('', include(router.urls)),
]
