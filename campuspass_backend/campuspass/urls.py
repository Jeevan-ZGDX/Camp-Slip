from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

api_urlpatterns = [
    path('auth/', include('campuspass.apps.authentication.urls')),
    path('students/', include('campuspass.apps.students.urls')),
    path('departments/', include('campuspass.apps.departments.urls')),
    path('outpass/', include('campuspass.apps.outpass.urls')),
    path('approvals/', include('campuspass.apps.approvals.urls')),
    path('qr/', include('campuspass.apps.qr_codes.urls')),
    path('verification/', include('campuspass.apps.verification.urls')),
    path('notifications/', include('campuspass.apps.notifications.urls')),
    path('dashboard/', include('campuspass.apps.dashboard.urls')),
    path('audit/', include('campuspass.apps.audit.urls')),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/', include(api_urlpatterns)),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/docs/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
