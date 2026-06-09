"""
Course, Chapter, and Enrollment models.

Design decisions:
  - Course.owner uses limit_choices_to as an advisory DB-level hint. Authoritative
    enforcement lives in the permission layer and perform_create, not the model,
    because limit_choices_to only restricts the admin form widget, not raw inserts.

  - Chapter.content is a JSONField that stores the Plate.js/Slate node tree verbatim.
    Structural validation is the responsibility of SlateDocumentField in serializers.py.
    Models stay schema-only; business logic does not belong here.

  - Chapter.order is advisory (not unique per course) to avoid complex swap operations
    when an instructor reorders chapters. The front end sorts by (order, created_at).

  - Enrollment uses a Status field rather than hard delete so that:
      1. There is an audit trail of all enrollment events.
      2. Re-enrollment reuses the existing row via a PATCH status update.
      3. The ACTIVE guard in get_queryset is a security constraint, not just UX.
"""

from django.conf import settings
from django.db import models


class Course(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_courses',
        limit_choices_to={'role': 'INSTRUCTOR'},
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'courses'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['owner'], name='course_owner_idx'),
        ]

    def __str__(self) -> str:
        return f'{self.title} ({self.owner.email})'


class Chapter(models.Model):
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='chapters',
    )
    title = models.CharField(max_length=255)
    content = models.JSONField(
        default=list,
        help_text='Plate.js/Slate JSON node tree. Structural validity enforced by SlateDocumentField.',
    )
    is_public = models.BooleanField(
        default=False,
        help_text='Only public chapters are surfaced to enrolled students.',
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text='Advisory sort key within the course; not unique to allow flexible reordering.',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'chapters'
        ordering = ['order', 'created_at']
        indexes = [
            # Covers the hot path: student reads for a given course filtered by is_public
            models.Index(fields=['course', 'is_public'], name='chapter_course_public_idx'),
        ]

    def __str__(self) -> str:
        visibility = 'public' if self.is_public else 'private'
        return f'[{visibility}] {self.course.title} › {self.title}'


class Enrollment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        ACTIVE = 'ACTIVE', 'Active'
        DROPPED = 'DROPPED', 'Dropped'

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='enrollments',
        limit_choices_to={'role': 'STUDENT'},
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='enrollments',
    )
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    enrolled_at = models.DateTimeField(auto_now_add=True)
    dropped_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Populated automatically when status transitions to DROPPED.',
    )

    class Meta:
        db_table = 'enrollments'
        # One record per (student, course) pair; re-enrollment updates status, not inserts.
        unique_together = [('student', 'course')]
        ordering = ['-enrolled_at']
        indexes = [
            # Covers the hot path: chapter queryset filtering by student + status
            models.Index(fields=['student', 'status'], name='enrollment_student_status_idx'),
        ]

    def __str__(self) -> str:
        return f'{self.student.email} → {self.course.title} [{self.status}]'
