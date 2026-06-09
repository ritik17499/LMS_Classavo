"""
LMS User model.

Replaces Django's default auth.User with an email-first, role-aware identity.
Role is a first-class field (not a Profile FK) because the two roles have
fundamentally different query access patterns that propagate into every ViewSet's
get_queryset — a FK join on every queryset would add noise with no benefit.

AUTH_USER_MODEL = 'users.User' must be declared in settings.py before any
app resolves its models. Changing this after the initial migration is painful.
"""

from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models

from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    """
    Central identity model for the LMS.

    AbstractBaseUser provides: password hashing, last_login, is_active.
    PermissionsMixin provides: groups, user_permissions, is_superuser.
    Everything else is domain-specific and defined here.
    """

    class Role(models.TextChoices):
        INSTRUCTOR = 'INSTRUCTOR', 'Instructor'
        STUDENT = 'STUDENT', 'Student'

    email = models.EmailField(
        unique=True,
        help_text='Primary identifier used as the login credential.',
    )
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        help_text=(
            'INSTRUCTOR: can create/own/manage courses and chapters. '
            'STUDENT: can enroll in courses and read public chapters.'
        ),
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'role']

    class Meta:
        db_table = 'users'
        verbose_name = 'user'
        verbose_name_plural = 'users'
        indexes = [
            models.Index(fields=['role'], name='user_role_idx'),
        ]

    def __str__(self) -> str:
        return f'{self.email} ({self.role})'

    @property
    def full_name(self) -> str:
        return f'{self.first_name} {self.last_name}'.strip()

    @property
    def is_instructor(self) -> bool:
        return self.role == self.Role.INSTRUCTOR

    @property
    def is_student(self) -> bool:
        return self.role == self.Role.STUDENT
