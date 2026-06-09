"""
URL routing for courses, chapters, and enrollments.

Registers three ViewSets via DefaultRouter (flat access):
  /api/courses/
  /api/chapters/
  /api/enrollments/

Also adds explicit nested chapter routes for RESTful traversal:
  /api/courses/<course_pk>/chapters/
  /api/courses/<course_pk>/chapters/<pk>/

Both route to the same ChapterViewSet. The nested URLs inject `course_pk` into
view.kwargs, which get_queryset uses for additional course-level scoping.
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ChapterViewSet, CourseViewSet, EnrollmentViewSet

router = DefaultRouter()
router.register('courses', CourseViewSet, basename='course')
router.register('chapters', ChapterViewSet, basename='chapter')
router.register('enrollments', EnrollmentViewSet, basename='enrollment')

# Explicit nested views — avoids the drf-nested-routers dependency while keeping
# the URL structure readable and the course_pk kwarg cleanly available in ViewSet.kwargs.
_chapter_list = ChapterViewSet.as_view({'get': 'list', 'post': 'create'})
_chapter_detail = ChapterViewSet.as_view({
    'get': 'retrieve',
    'put': 'update',
    'patch': 'partial_update',
    'delete': 'destroy',
})

urlpatterns = [
    path('', include(router.urls)),
    path(
        'courses/<int:course_pk>/chapters/',
        _chapter_list,
        name='course-chapter-list',
    ),
    path(
        'courses/<int:course_pk>/chapters/<int:pk>/',
        _chapter_detail,
        name='course-chapter-detail',
    ),
]
