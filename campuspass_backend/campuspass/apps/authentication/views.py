import uuid
from django.utils import timezone
from django.conf import settings
from django.contrib.auth import update_session_auth_hash
from rest_framework import status, generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

from campuspass.common.responses import success_response, created_response, error_response
from campuspass.common.enums import UserRole, AuditAction
from campuspass.common.utils import get_client_ip, get_user_agent, generate_uuid_token
from campuspass.apps.audit.services import AuditService
from .models import User, PasswordResetToken, LoginAttempt
from .serializers import (
    UserSerializer, RegisterSerializer, LoginSerializer,
    CustomTokenObtainPairSerializer, TokenResponseSerializer,
    PasswordChangeSerializer, PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer, LogoutSerializer, ProfileUpdateSerializer,
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        tags=['Authentication'],
        summary='Register new user',
        request=RegisterSerializer,
        responses={201: OpenApiResponse(response=UserSerializer, description='User registered successfully')},
    )
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        AuditService.log(
            action=AuditAction.CREATE,
            actor=user,
            resource_type='User',
            resource_id=str(user.id),
            description=f'User registered: {user.email}',
            request=request,
        )

        return created_response(
            data=UserSerializer(user).data,
            message='Registration successful. Please login.',
        )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        tags=['Authentication'],
        summary='Login with email and password',
        request=LoginSerializer,
        responses={200: TokenResponseSerializer},
    )
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        ip_address = get_client_ip(request)

        token = CustomTokenObtainPairSerializer.get_token(user)
        LoginAttempt.objects.create(
            email=user.email,
            ip_address=ip_address,
            user_agent=get_user_agent(request),
            is_success=True,
        )

        user.last_login_ip = ip_address
        user.save(update_fields=['last_login_ip'])

        AuditService.log(
            action=AuditAction.LOGIN,
            actor=user,
            resource_type='User',
            resource_id=str(user.id),
            description=f'User logged in: {user.email}',
            request=request,
        )

        return success_response(
            data={
                'access': str(token.access_token),
                'refresh': str(token),
                'user': UserSerializer(user).data,
            },
            message='Login successful.',
        )


class LogoutView(APIView):
    @extend_schema(
        tags=['Authentication'],
        summary='Logout and blacklist refresh token',
        request=LogoutSerializer,
    )
    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            refresh = RefreshToken(serializer.validated_data['refresh'])
            refresh.blacklist()
        except TokenError:
            return error_response('Invalid or expired token.', status_code=status.HTTP_400_BAD_REQUEST)

        AuditService.log(
            action=AuditAction.LOGOUT,
            actor=request.user,
            resource_type='User',
            resource_id=str(request.user.id),
            description=f'User logged out: {request.user.email}',
            request=request,
        )

        return success_response(message='Logout successful.')


class TokenRefreshViewCustom(TokenRefreshView):
    @extend_schema(
        tags=['Authentication'],
        summary='Refresh access token',
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)


class ProfileView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    @extend_schema(
        tags=['Authentication'],
        summary='Get current user profile',
    )
    def get_object(self):
        return self.request.user

    @extend_schema(
        tags=['Authentication'],
        summary='Update current user profile',
        request=ProfileUpdateSerializer,
    )
    def put(self, request, *args, **kwargs):
        return self.update(request, *args, **kwargs)

    @extend_schema(
        tags=['Authentication'],
        summary='Partially update current user profile',
        request=ProfileUpdateSerializer,
    )
    def patch(self, request, *args, **kwargs):
        return self.partial_update(request, *args, **kwargs)

    def perform_update(self, serializer):
        user = serializer.save()
        AuditService.log(
            action=AuditAction.UPDATE,
            actor=self.request.user,
            resource_type='User',
            resource_id=str(user.id),
            description='Profile updated',
            request=self.request,
        )


class ChangePasswordView(APIView):
    @extend_schema(
        tags=['Authentication'],
        summary='Change password',
        request=PasswordChangeSerializer,
    )
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        update_session_auth_hash(request, user)

        AuditService.log(
            action=AuditAction.UPDATE,
            actor=user,
            resource_type='User',
            resource_id=str(user.id),
            description='Password changed',
            request=request,
        )

        return success_response(message='Password changed successfully.')


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        tags=['Authentication'],
        summary='Request password reset link',
        request=PasswordResetRequestSerializer,
    )
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        user = User.objects.get(email=email, is_active=True)

        token = generate_uuid_token()
        PasswordResetToken.objects.create(
            user=user,
            token=token,
            expires_at=timezone.now() + timezone.timedelta(hours=1),
        )

        # TODO: Send email with reset token
        return success_response(
            message='Password reset link has been sent to your email.',
            data={'reset_token': token},
        )


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        tags=['Authentication'],
        summary='Confirm password reset',
        request=PasswordResetConfirmSerializer,
    )
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        reset_token = PasswordResetToken.objects.get(
            token=serializer.validated_data['token'],
            is_used=False,
        )
        user = reset_token.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        reset_token.is_used = True
        reset_token.save()

        AuditService.log(
            action=AuditAction.UPDATE,
            actor=user,
            resource_type='User',
            resource_id=str(user.id),
            description='Password reset completed',
            request=request,
        )

        return success_response(message='Password has been reset successfully.')


class AdminUserManagementView(generics.ListCreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ['email', 'username', 'first_name', 'last_name', 'phone']
    filterset_fields = ['role', 'is_active', 'is_verified']

    @extend_schema(
        tags=['Authentication'],
        summary='List all users (Admin)',
        parameters=[
            OpenApiParameter(name='role', description='Filter by role', required=False, type=str),
            OpenApiParameter(name='search', description='Search by email, username, name', required=False, type=str),
        ],
    )
    def get(self, request, *args, **kwargs):
        if request.user.role not in ['ADMIN', 'HOD', 'WARDEN']:
            return error_response('Permission denied.', status_code=status.HTTP_403_FORBIDDEN)
        return super().get(request, *args, **kwargs)

    @extend_schema(
        tags=['Authentication'],
        summary='Create new user (Admin)',
    )
    def post(self, request, *args, **kwargs):
        if request.user.role != 'ADMIN':
            return error_response('Permission denied.', status_code=status.HTTP_403_FORBIDDEN)
        return super().post(request, *args, **kwargs)


class AdminUserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'id'

    @extend_schema(
        tags=['Authentication'],
        summary='Get/Update/Delete user (Admin)',
    )
    def get(self, request, *args, **kwargs):
        if request.user.role not in ['ADMIN', 'HOD', 'WARDEN']:
            return error_response('Permission denied.', status_code=status.HTTP_403_FORBIDDEN)
        return super().get(request, *args, **kwargs)

    def perform_destroy(self, instance):
        AuditService.log(
            action=AuditAction.DELETE,
            actor=self.request.user,
            resource_type='User',
            resource_id=str(instance.id),
            description=f'User deleted: {instance.email}',
            request=self.request,
        )
        instance.is_active = False
        instance.save()
