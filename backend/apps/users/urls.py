"""URL routing for all authentication and user-profile endpoints."""

from django.urls import path
from rest_framework_simplejwt.views import TokenVerifyView

from .views import (
    CookieTokenRefreshView,
    LMSTokenObtainPairView,
    LogoutView,
    RegisterView,
    UserProfileView,
)

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LMSTokenObtainPairView.as_view(), name='auth-login'),
    path('auth/token/refresh/', CookieTokenRefreshView.as_view(), name='auth-token-refresh'),
    path('auth/token/verify/', TokenVerifyView.as_view(), name='auth-token-verify'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/me/', UserProfileView.as_view(), name='auth-me'),
]
