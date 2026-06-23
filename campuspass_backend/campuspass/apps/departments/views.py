from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, OpenApiParameter
from .models import Department, Course, Hostel
from .serializers import (
    DepartmentSerializer, DepartmentListSerializer,
    CourseSerializer, CourseListSerializer, HostelSerializer,
)
from campuspass.common.permissions import IsAdmin, IsAdminOrReadOnly
from campuspass.common.responses import success_response, created_response, error_response
from campuspass.common.pagination import PaginatedResponseMixin
from campuspass.common.enums import AuditAction
from campuspass.apps.audit.services import AuditService


@extend_schema(tags=['Departments'])
class DepartmentViewSet(viewsets.ModelViewSet, PaginatedResponseMixin):
    queryset = Department.objects.all()
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['name', 'code', 'created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return DepartmentListSerializer
        return DepartmentSerializer

    @extend_schema(summary='List all departments', parameters=[
        OpenApiParameter(name='search', description='Search by name/code', required=False, type=str),
        OpenApiParameter(name='is_active', description='Filter by active status', required=False, type=bool),
    ])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(summary='Create department')
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        AuditService.log(AuditAction.CREATE, request.user, 'Department', str(serializer.instance.id),
                         f'Department created: {serializer.instance.name}', request=request)
        return created_response(data=serializer.data, message='Department created successfully')

    @extend_schema(summary='Get department details')
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(summary='Update department')
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @extend_schema(summary='Partially update department')
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(summary='Delete department')
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        AuditService.log(AuditAction.DELETE, request.user, 'Department', str(instance.id),
                         f'Department deleted: {instance.name}', request=request)
        instance.is_active = False
        instance.save()
        return success_response(message='Department deactivated successfully')


@extend_schema(tags=['Departments'])
class CourseViewSet(viewsets.ModelViewSet, PaginatedResponseMixin):
    queryset = Course.objects.all()
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'department']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'code']

    def get_serializer_class(self):
        if self.action == 'list':
            return CourseListSerializer
        return CourseSerializer

    @extend_schema(summary='List all courses', parameters=[
        OpenApiParameter(name='department', description='Filter by department ID', required=False, type=str),
        OpenApiParameter(name='search', description='Search by name/code', required=False, type=str),
    ])
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(summary='Create course')
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(summary='Get course details')
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(summary='Update course')
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @extend_schema(summary='Partially update course')
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(summary='Delete course')
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return success_response(message='Course deactivated successfully')


@extend_schema(tags=['Departments'])
class HostelViewSet(viewsets.ModelViewSet, PaginatedResponseMixin):
    queryset = Hostel.objects.all()
    permission_classes = [IsAdminOrReadOnly]
    serializer_class = HostelSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'type']
    search_fields = ['name', 'code']
    ordering_fields = ['name', 'capacity']

    @extend_schema(summary='List all hostels')
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(summary='Create hostel')
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(summary='Get hostel details')
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(summary='Update hostel')
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @extend_schema(summary='Partially update hostel')
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(summary='Delete hostel')
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return success_response(message='Hostel deactivated successfully')
