from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'profiles', views.StudentProfileViewSet, basename='student-profile')

urlpatterns = [
    path('', include(router.urls)),
]
