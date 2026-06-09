"""
Serializers for user registration, profile management, and JWT token issuance.
"""

from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    """
    Handles new user creation.

    password_confirm is validated then discarded — it never reaches the model layer.
    validate_password enforces Django's AUTH_PASSWORD_VALIDATORS chain, which
    includes minimum length, common password, and similarity checks.
    """

    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'},
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
    )

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name',
            'role', 'password', 'password_confirm',
        ]
        read_only_fields = ['id']

    def validate_role(self, value: str) -> str:
        """Reject any value outside the declared TextChoices to prevent stray strings."""
        if value not in User.Role.values:
            raise serializers.ValidationError(
                f'Invalid role. Accepted values: {", ".join(User.Role.values)}.'
            )
        return value

    def validate(self, attrs: dict) -> dict:
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data: dict) -> User:
        return User.objects.create_user(**validated_data)


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Read/update profile. Email and role are read-only to prevent self-service
    identity change or privilege escalation.
    """

    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name',
            'full_name', 'role', 'date_joined',
        ]
        read_only_fields = ['id', 'email', 'role', 'full_name', 'date_joined']


class LMSTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Embeds LMS-specific claims into the JWT access token payload.

    Adding role, email, and full_name at issuance lets the frontend determine
    routing (instructor workspace vs. student workspace) by decoding the token
    locally, eliminating a round-trip to /api/auth/me/ on every page load.

    Accepted stale-claim window: access tokens live 15 minutes. If an admin
    changes a user's role, the stale claim persists until token expiry. This is
    acceptable because role assignment is an admin-only, non-self-service operation.
    """

    @classmethod
    def get_token(cls, user: User):
        token = super().get_token(user)
        token['role'] = user.role
        token['email'] = user.email
        token['full_name'] = user.full_name
        return token
