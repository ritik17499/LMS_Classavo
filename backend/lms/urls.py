"""Root URL configuration.

All API routes are namespaced under /api/ and delegated to the respective app
URL modules. Django admin retains its default path.
"""

from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include


def health_check(request):
    """Lightweight liveness probe used by Railway and Docker health checks."""
    return JsonResponse({'status': 'ok'})


urlpatterns = [
    path('health/', health_check, name='health-check'),
    path('admin/', admin.site.urls),
    path('api/', include('apps.users.urls')),
    path('api/', include('apps.courses.urls')),
]
