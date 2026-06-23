from rest_framework.permissions import BasePermission, SAFE_METHODS
from campuspass.common.enums import UserRole


class IsStudent(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == UserRole.STUDENT


class IsFaculty(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == UserRole.FACULTY


class IsHOD(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == UserRole.HOD


class IsWarden(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == UserRole.WARDEN


class IsSecurity(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == UserRole.SECURITY


class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == UserRole.ADMIN


class IsAdminOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.role == UserRole.ADMIN


class IsFacultyOrHODOrWarden(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in [UserRole.FACULTY, UserRole.HOD, UserRole.WARDEN]


class IsApprover(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in [UserRole.FACULTY, UserRole.HOD, UserRole.WARDEN, UserRole.ADMIN]


class IsVerifier(BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in [UserRole.SECURITY, UserRole.ADMIN]


class IsOwnerOrApprover(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role == UserRole.ADMIN:
            return True
        if hasattr(obj, 'student') and obj.student.user == request.user:
            return True
        if request.user.role in [UserRole.FACULTY, UserRole.HOD, UserRole.WARDEN]:
            return True
        return False


class IsOwnProfile(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role == UserRole.ADMIN:
            return True
        return obj.user == request.user


class HasRole(BasePermission):
    allowed_roles = []

    def __init__(self, allowed_roles=None):
        self.allowed_roles = allowed_roles or []

    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in self.allowed_roles
