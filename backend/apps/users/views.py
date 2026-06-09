"""
Authentication and user profile views.

Auth endpoint map:
  POST   /api/auth/register/          Create a new account (INSTRUCTOR or STUDENT)
  POST   /api/auth/login/             Issue access token (body) + refresh token (httpOnly cookie)
  POST   /api/auth/token/refresh/     Rotate tokens; reads refresh from cookie, returns new access in body
  POST   /api/auth/token/verify/      Validate an access token (SimpleJWT built-in)
  POST   /api/auth/logout/            Clear the refresh-token cookie
  GET    /api/auth/me/                Retrieve own profile
  PUT    /api/auth/me/                Full profile update
  PATCH  /api/auth/me/                Partial profile update

Token storage strategy (enforced here, documented for the frontend team):
  - Access token  → in-memory Zustand store; evaporates on tab close; never touches localStorage
  - Refresh token → httpOnly; SameSite=Lax; Secure cookie; inaccessible to JavaScript
"""

from django.conf import settings
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import LMSTokenObtainPairSerializer, RegisterSerializer, UserProfileSerializer

_REFRESH_COOKIE_NAME = 'refresh_token'
_REFRESH_COOKIE_PATH = '/api/auth/token/refresh/'


def _refresh_cookie_kwargs(value: str) -> dict:
    """Centralise cookie attributes so login and refresh views stay in sync."""
    return {
        'key': _REFRESH_COOKIE_NAME,
        'value': value,
        'httponly': True,
        'secure': not settings.DEBUG,
        'samesite': 'Lax',
        'max_age': int(settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()),
        'path': _REFRESH_COOKIE_PATH,
    }


class RegisterView(generics.CreateAPIView):
    """Creates a new LMS user. Open to unauthenticated requests."""

    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer


class LMSTokenObtainPairView(TokenObtainPairView):
    """
    Authenticates the user and issues tokens.

    The refresh token is stripped from the response body and placed in an
    httpOnly cookie instead, so JavaScript cannot read or exfiltrate it.
    The access token remains in the response body for the frontend store.
    """

    serializer_class = LMSTokenObtainPairSerializer

    def post(self, request, *args, **kwargs) -> Response:
        response = super().post(request, *args, **kwargs)

        if response.status_code == status.HTTP_200_OK:
            refresh_token = response.data.pop('refresh', None)
            if refresh_token:
                response.set_cookie(**_refresh_cookie_kwargs(refresh_token))

        return response


class CookieTokenRefreshView(APIView):
    """
    Rotates the refresh token stored in the httpOnly cookie.

    Reads the cookie, passes it through SimpleJWT's TokenRefreshSerializer
    (which handles blacklist lookup and issues a new token pair when
    ROTATE_REFRESH_TOKENS=True), then returns the new access token in the body
    and plants the new refresh token back into the cookie.

    On failure, clears the cookie so the client falls back to the login flow
    rather than looping on a permanently invalid token.
    """

    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs) -> Response:
        refresh_token = request.COOKIES.get(_REFRESH_COOKIE_NAME)

        if not refresh_token:
            return Response(
                {'detail': 'No refresh token found. Please log in again.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = TokenRefreshSerializer(data={'refresh': refresh_token})

        try:
            serializer.is_valid(raise_exception=True)
        except (TokenError, InvalidToken):
            response = Response(
                {'detail': 'Refresh token is invalid or expired. Please log in again.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
            response.delete_cookie(_REFRESH_COOKIE_NAME, path=_REFRESH_COOKIE_PATH)
            return response

        validated = serializer.validated_data
        response = Response({'access': validated['access']}, status=status.HTTP_200_OK)

        # ROTATE_REFRESH_TOKENS=True produces a new refresh token in validated_data
        if 'refresh' in validated:
            response.set_cookie(**_refresh_cookie_kwargs(validated['refresh']))

        return response


class LogoutView(APIView):
    """
    Clears the refresh-token cookie.

    The short-lived access token remains technically valid until its 15-minute TTL.
    This is accepted behaviour for this threat model. If hard invalidation is needed,
    add the access token's jti to a server-side denylist checked in JWTAuthentication.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs) -> Response:
        response = Response(
            {'detail': 'Successfully logged out.'},
            status=status.HTTP_200_OK,
        )
        response.delete_cookie(_REFRESH_COOKIE_NAME, path=_REFRESH_COOKIE_PATH)
        return response


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Authenticated users may view and update their own profile fields."""

    permission_classes = [IsAuthenticated]
    serializer_class = UserProfileSerializer
    http_method_names = ['get', 'put', 'patch', 'head', 'options']

    def get_object(self) -> 'User':
        return self.request.user
