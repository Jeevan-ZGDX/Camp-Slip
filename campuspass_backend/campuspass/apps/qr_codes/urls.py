from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'passes', views.QRPassViewSet, basename='qr-pass')

urlpatterns = [
    path('', include(router.urls)),
]
