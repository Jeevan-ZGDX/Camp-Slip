from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'departments', views.DepartmentViewSet, basename='department')
router.register(r'courses', views.CourseViewSet, basename='course')
router.register(r'hostels', views.HostelViewSet, basename='hostel')

urlpatterns = [
    path('', include(router.urls)),
]
