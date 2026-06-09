"""
Serializers for Course, Chapter, and Enrollment.

SlateDocumentField is the authoritative validation layer for Plate.js/Slate content.
The JSONField at the model layer performs no semantic validation — it only ensures
the stored value is valid JSON. All structural correctness guarantees are here.
"""

from typing import Any

from django.utils import timezone
from rest_framework import serializers

from apps.users.serializers import UserProfileSerializer
from .models import Chapter, Course, Enrollment


# ──────────────────────────────────────────────────────────────────────────────
# Slate document field
# ──────────────────────────────────────────────────────────────────────────────

class SlateDocumentField(serializers.Field):
    """
    Custom DRF field that validates a Plate.js / Slate.js JSON document tree.

    Enforces the structural invariants that Slate.js itself requires at runtime:
      1. Root value is a non-empty JSON array.
      2. Every node is a plain dict.
      3. Each node has exactly one of:
           'children' (list)  → Element node (e.g. paragraph, heading)
           'text'     (str)   → Text leaf    (e.g. bold/italic run)
         A node cannot have both. A node must have one.
      4. Element nodes must have a string 'type' field.
      5. Recursion depth is bounded to prevent stack overflow on pathological input.
      6. Total node count is bounded to prevent oversized payload processing.

    This field is intentionally agnostic about *which* element types are valid
    (e.g. 'p', 'h1', 'blockquote'). Add an allowlist if you want to lock down
    the element vocabulary at the API boundary.
    """

    MAX_NODES: int = 10_000
    MAX_DEPTH: int = 10

    def to_internal_value(self, data: Any) -> list:
        if not isinstance(data, list):
            raise serializers.ValidationError(
                'Slate document must be a JSON array at the root level.'
            )
        if len(data) == 0:
            raise serializers.ValidationError(
                'Slate document must contain at least one node.'
            )

        # Use a mutable dict for the counter so recursive calls share the same reference
        node_count = {'value': 0}
        self._validate_node_list(data, depth=0, node_count=node_count)
        return data

    def _validate_node_list(self, nodes: list, depth: int, node_count: dict) -> None:
        if depth > self.MAX_DEPTH:
            raise serializers.ValidationError(
                f'Slate document exceeds the maximum nesting depth of {self.MAX_DEPTH}.'
            )

        for node in nodes:
            node_count['value'] += 1
            if node_count['value'] > self.MAX_NODES:
                raise serializers.ValidationError(
                    f'Slate document exceeds the maximum node count of {self.MAX_NODES}.'
                )

            if not isinstance(node, dict):
                raise serializers.ValidationError(
                    f'Each Slate node must be a JSON object, not {type(node).__name__!r}.'
                )

            has_children = 'children' in node
            has_text = 'text' in node

            if has_children and has_text:
                raise serializers.ValidationError(
                    "A Slate node cannot simultaneously have both 'children' and 'text' keys. "
                    "Element nodes use 'children'; text leaves use 'text'."
                )

            if not has_children and not has_text:
                raise serializers.ValidationError(
                    "Each Slate node must have either 'children' (element node) "
                    "or 'text' (text leaf). Neither was found."
                )

            if has_text:
                if not isinstance(node['text'], str):
                    raise serializers.ValidationError(
                        f"Slate text leaf 'text' value must be a string, "
                        f"not {type(node['text']).__name__!r}."
                    )

            if has_children:
                if not isinstance(node.get('type'), str):
                    raise serializers.ValidationError(
                        "Slate element node must have a string 'type' field "
                        "(e.g. 'p', 'h1', 'blockquote')."
                    )
                if not isinstance(node['children'], list):
                    raise serializers.ValidationError(
                        "Slate element node 'children' must be a JSON array."
                    )
                self._validate_node_list(node['children'], depth + 1, node_count)

    def to_representation(self, value: Any) -> Any:
        """Pass through the stored JSON tree unchanged for serialization."""
        return value


# ──────────────────────────────────────────────────────────────────────────────
# Course serializers
# ──────────────────────────────────────────────────────────────────────────────

class CourseSerializer(serializers.ModelSerializer):
    """
    Full course representation for list/create/retrieve/update operations.

    owner_email is read-only; the FK is injected from request.user in perform_create.
    chapter_count uses a method field. At scale (large page sizes), replace with
    an annotation: Course.objects.annotate(chapter_count=Count('chapters')) in
    get_queryset to collapse N+1 into a single aggregating query.
    """

    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    chapter_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 'title', 'description',
            'owner_email', 'chapter_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'owner_email', 'chapter_count', 'created_at', 'updated_at']

    def get_chapter_count(self, obj: Course) -> int:
        return obj.chapters.count()


# ──────────────────────────────────────────────────────────────────────────────
# Chapter serializers
# ──────────────────────────────────────────────────────────────────────────────

class ChapterSerializer(serializers.ModelSerializer):
    """
    Full chapter serializer for instructor read/write operations.
    The content field runs SlateDocumentField validation on every write.
    """

    content = SlateDocumentField()

    class Meta:
        model = Chapter
        fields = [
            'id', 'course', 'title', 'content',
            'is_public', 'order', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ChapterReadSerializer(serializers.ModelSerializer):
    """
    Read-only chapter serializer for student content consumption.

    Omits 'course' (already scoped by the enrollment check in get_queryset),
    'is_public' (always True by definition of the queryset), and write-only
    fields to minimise the student-facing payload.
    """

    content = SlateDocumentField(read_only=True)

    class Meta:
        model = Chapter
        fields = ['id', 'title', 'content', 'order', 'updated_at']
        read_only_fields = ['id', 'title', 'content', 'order', 'updated_at']


# ──────────────────────────────────────────────────────────────────────────────
# Enrollment serializers
# ──────────────────────────────────────────────────────────────────────────────

class EnrollmentSerializer(serializers.ModelSerializer):
    """
    Handles enrollment creation (student joins a course).

    student is always read-only in the API response; it is injected from
    request.user in EnrollmentViewSet.perform_create so a student cannot
    create an enrollment record for another user.
    """

    student = UserProfileSerializer(read_only=True)
    course_title = serializers.CharField(source='course.title', read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            'id', 'student', 'course', 'course_title',
            'status', 'enrolled_at', 'dropped_at',
        ]
        read_only_fields = ['id', 'student', 'course_title', 'enrolled_at', 'dropped_at']

    def validate(self, attrs: dict) -> dict:
        request = self.context.get('request')
        course = attrs.get('course')

        if self.instance is None and request and course:
            existing = Enrollment.objects.filter(
                student=request.user,
                course=course,
            ).first()

            if existing:
                if existing.status == Enrollment.Status.ACTIVE:
                    raise serializers.ValidationError(
                        {'course': 'You are already actively enrolled in this course.'}
                    )
                if existing.status == Enrollment.Status.DROPPED:
                    # Guide the client toward the correct endpoint
                    raise serializers.ValidationError({
                        'course': (
                            'You previously dropped this course. '
                            f'Re-enroll via PATCH /api/enrollments/{existing.pk}/ '
                            'with {"status": "ACTIVE"}.'
                        )
                    })

        return attrs


class EnrollmentUpdateSerializer(serializers.ModelSerializer):
    """
    Restricted serializer for status-only enrollment updates (drop or re-enroll).

    Only the 'status' field is writable post-creation. The dropped_at timestamp
    is managed automatically in the update method based on the incoming status value.
    Invalid status transitions raise a validation error rather than silently accepting them.
    """

    class Meta:
        model = Enrollment
        fields = ['id', 'status', 'dropped_at']
        read_only_fields = ['id', 'dropped_at']

    def validate_status(self, value: str) -> str:
        allowed_transitions: dict[str, list[str]] = {
            Enrollment.Status.ACTIVE: [Enrollment.Status.DROPPED],
            Enrollment.Status.DROPPED: [Enrollment.Status.ACTIVE],
            Enrollment.Status.PENDING: [Enrollment.Status.ACTIVE, Enrollment.Status.DROPPED],
        }

        if self.instance:
            current = self.instance.status
            allowed = allowed_transitions.get(current, [])
            if value not in allowed:
                raise serializers.ValidationError(
                    f'Cannot transition from {current!r} to {value!r}. '
                    f'Allowed: {[str(s) for s in allowed]}.'
                )
        return value

    def update(self, instance: Enrollment, validated_data: dict) -> Enrollment:
        new_status = validated_data.get('status')
        if new_status == Enrollment.Status.DROPPED:
            validated_data['dropped_at'] = timezone.now()
        elif new_status == Enrollment.Status.ACTIVE:
            validated_data['dropped_at'] = None
        return super().update(instance, validated_data)
