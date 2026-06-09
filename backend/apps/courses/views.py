"""
Course, Chapter, and Enrollment ViewSets.

Query scoping contract:
  get_queryset is the single authoritative source for what rows a given user can see.
  It is called for every list, retrieve, and mutating action — never bypass it.
  Permission classes handle view-level access (role checks) and object-level mutation
  guards. The two layers are complementary, not redundant: queryset scoping prevents
  data leaks in list responses; object permissions prevent direct-PK access attacks.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.users.models import User
from apps.users.permissions import IsInstructor, IsStudent
from .models import Chapter, Course, Enrollment
from .permissions import IsCourseOwner
from .serializers import (
    ChapterReadSerializer,
    ChapterSerializer,
    CourseSerializer,
    EnrollmentSerializer,
    EnrollmentUpdateSerializer,
)


class CourseViewSet(viewsets.ModelViewSet):
    """
    Instructors: full CRUD scoped to their own courses.
    Students:    read-only list/retrieve of courses they are actively enrolled in.

    get_queryset is the security boundary — students physically cannot retrieve a
    Course row they are not enrolled in, regardless of what PK they request.
    """

    serializer_class = CourseSerializer

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsInstructor()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user

        if user.role == User.Role.INSTRUCTOR:
            return (
                Course.objects
                .filter(owner=user)
                .select_related('owner')
            )

        # Students see only courses where they hold an ACTIVE enrollment record
        return (
            Course.objects
            .filter(
                enrollments__student=user,
                enrollments__status=Enrollment.Status.ACTIVE,
            )
            .select_related('owner')
            .distinct()  # Guard against fan-out from the enrollments join
        )

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def perform_destroy(self, instance):
        # Belt-and-suspenders: get_queryset already limits to owner=user,
        # but an explicit check here makes the invariant visible.
        if instance.owner != self.request.user:
            raise PermissionDenied('You do not own this course.')
        instance.delete()

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def catalog(self, request):
        """
        Returns all courses regardless of enrollment status.
        Used by the student catalog page so students can discover and join courses.
        Instructors may also browse the full catalog.
        """
        queryset = Course.objects.all().select_related('owner')
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = CourseSerializer(page, many=True, context={'request': request})
            return self.get_paginated_response(serializer.data)
        serializer = CourseSerializer(queryset, many=True, context={'request': request})
        return Response(serializer.data)


class ChapterViewSet(viewsets.ModelViewSet):
    """
    Instructors: full CRUD on chapters within their owned courses.
    Students:    read-only access to is_public=True chapters in enrolled courses.

    Supports two URL access patterns (both route to this ViewSet):
      Flat:   /api/chapters/          (filter by ?course_id=<pk> query param)
      Nested: /api/courses/<course_pk>/chapters/  (course_pk injected by URL router)
    """

    def get_permissions(self):
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsCourseOwner()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        """Students receive the read-only serializer; instructors get the full one."""
        user = self.request.user
        if user.is_authenticated and user.role == User.Role.STUDENT:
            return ChapterReadSerializer
        return ChapterSerializer

    def get_queryset(self):
        user = self.request.user
        course_pk = (
            self.kwargs.get('course_pk')
            or self.request.query_params.get('course_id')
        )

        if user.role == User.Role.INSTRUCTOR:
            qs = (
                Chapter.objects
                .filter(course__owner=user)
                .select_related('course')
            )
            if course_pk:
                qs = qs.filter(course_id=course_pk)
            return qs

        # Students: two-step query keeps the execution plan simple and predictable.
        # The enrolled_course_ids set is typically small (a student joins few courses),
        # and PostgreSQL's IN-list planner is highly optimised for this shape.
        enrolled_course_ids = (
            Enrollment.objects
            .filter(student=user, status=Enrollment.Status.ACTIVE)
            .values_list('course_id', flat=True)
        )

        qs = (
            Chapter.objects
            .filter(
                course_id__in=enrolled_course_ids,
                is_public=True,
            )
            .select_related('course')
        )
        if course_pk:
            qs = qs.filter(course_id=course_pk)
        return qs

    def perform_create(self, serializer):
        course = serializer.validated_data.get('course')
        if course.owner != self.request.user:
            raise PermissionDenied('You can only create chapters for courses you own.')
        serializer.save()


class EnrollmentViewSet(viewsets.ModelViewSet):
    """
    Students: create (join), list own enrollments, PATCH status (drop / re-enroll).
    Instructors: read-only list of all enrollments across their courses.

    DELETE is disabled — status transitions replace hard deletes to preserve the
    audit trail and allow re-enrollment without losing the enrolled_at timestamp.
    """

    # DELETE intentionally excluded
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_permissions(self):
        if self.action == 'create':
            return [IsStudent()]
        if self.action == 'partial_update':
            return [IsStudent()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action == 'partial_update':
            return EnrollmentUpdateSerializer
        return EnrollmentSerializer

    def get_queryset(self):
        user = self.request.user

        if user.role == User.Role.INSTRUCTOR:
            return (
                Enrollment.objects
                .filter(course__owner=user)
                .select_related('student', 'course')
            )

        return (
            Enrollment.objects
            .filter(student=user)
            .select_related('course')
        )

    def perform_create(self, serializer):
        # student FK is always sourced from the authenticated user, never from the request body
        serializer.save(student=self.request.user)

    def perform_update(self, serializer):
        if serializer.instance.student != self.request.user:
            raise PermissionDenied('You can only modify your own enrollment records.')
        serializer.save()
