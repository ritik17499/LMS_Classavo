"""
Role-based permission primitives for the LMS.

These classes are single-concern building blocks, designed to be composed via
the | and & operators supported by DRF 3.9+. Each class answers one question:
"Is this authenticated user in role X?" — nothing more.

Object-level concerns (course ownership, enrollment status) live in
apps.courses.permissions where they have access to the relevant models.
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS

from .models import User


class IsInstructor(BasePermission):
    """Grants access exclusively to authenticated INSTRUCTOR users."""

    message = 'Access restricted to instructors.'

    def has_permission(self, request, view) -> bool:
        return (
            request.user.is_authenticated
            and request.user.role == User.Role.INSTRUCTOR
        )


class IsStudent(BasePermission):
    """Grants access exclusively to authenticated STUDENT users."""

    message = 'Access restricted to students.'

    def has_permission(self, request, view) -> bool:
        return (
            request.user.is_authenticated
            and request.user.role == User.Role.STUDENT
        )


class IsInstructorOrReadOnly(BasePermission):
    """
    Permits any authenticated user to perform safe (GET/HEAD/OPTIONS) requests.
    Restricts state-mutating requests to INSTRUCTOR users only.
    """

    message = 'Write access is restricted to instructors.'

    def has_permission(self, request, view) -> bool:
        if not request.user.is_authenticated:
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role == User.Role.INSTRUCTOR
