from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'approvals', views.ApprovalViewSet, basename='approval')
router.register(r'configurations', views.ApprovalConfigurationViewSet, basename='approval-config')

urlpatterns = [
    path('', include(router.urls)),
]
