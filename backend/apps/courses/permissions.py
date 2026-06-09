"""
Course and chapter permission classes.

Two-layer defence model:
  Layer 1 — get_queryset (in views.py): prevents unauthorised objects from
             appearing in list responses by never fetching them from the DB.
  Layer 2 — has_object_permission (here): prevents a client who knows a specific
             PK from accessing it directly via a hand-crafted URL.

Neither layer is redundant. A student who guesses a chapter PK can bypass
queryset scoping if object-level permissions are absent, and vice versa.
"""

from rest_framework.permissions import BasePermission, SAFE_METHODS

from apps.users.models import User
from .models import Chapter, Course, Enrollment


class IsCourseOwner(BasePermission):
    """
    View-level: requires the user to be an INSTRUCTOR for any write request.
    Object-level: additionally requires that the INSTRUCTOR owns the specific
                  Course or Chapter's parent Course being mutated.

    Applied to ChapterViewSet write actions. For CourseViewSet, perform_destroy
    performs the same owner check inline since the ViewSet already scopes
    get_queryset to owner=request.user.
    """

    message = 'You do not have permission to modify this resource.'

    def has_permission(self, request, view) -> bool:
        if request.method in SAFE_METHODS:
            return request.user.is_authenticated
        return (
            request.user.is_authenticated
            and request.user.role == User.Role.INSTRUCTOR
        )

    def has_object_permission(self, request, view, obj) -> bool:
        if request.method in SAFE_METHODS:
            return True

        if isinstance(obj, Chapter):
            return obj.course.owner == request.user

        if isinstance(obj, Course):
            return obj.owner == request.user

        return False


class IsEnrolledActiveStudent(BasePermission):
    """
    Object-level guard for individual Chapter retrieval.

    Verifies the requesting student has an ACTIVE enrollment in the chapter's
    parent course. This is a secondary guard — the primary enforcement is the
    enrolled_course_ids filter in ChapterViewSet.get_queryset. This class
    ensures that direct PK access is also protected.
    """

    message = 'You must be actively enrolled in this course to access this content.'

    def has_permission(self, request, view) -> bool:
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj) -> bool:
        user = request.user

        if user.role == User.Role.INSTRUCTOR:
            if isinstance(obj, Chapter):
                return obj.course.owner == user
            return False

        # Student: must have an active enrollment for the chapter's course
        if isinstance(obj, Chapter):
            return Enrollment.objects.filter(
                student=user,
                course=obj.course,
                status=Enrollment.Status.ACTIVE,
            ).exists()

        return False
