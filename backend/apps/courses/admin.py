"""Django admin registration for Course, Chapter, and Enrollment models."""

from django.contrib import admin

from .models import Chapter, Course, Enrollment


class ChapterInline(admin.TabularInline):
    model = Chapter
    fields = ('title', 'order', 'is_public')
    extra = 0
    ordering = ('order',)
    show_change_link = True


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('title', 'owner', 'chapter_count', 'created_at', 'updated_at')
    list_filter = ('owner',)
    search_fields = ('title', 'owner__email')
    ordering = ('-created_at',)
    inlines = [ChapterInline]

    @admin.display(description='Chapters')
    def chapter_count(self, obj):
        return obj.chapters.count()


@admin.register(Chapter)
class ChapterAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order', 'is_public', 'updated_at')
    list_filter = ('is_public', 'course')
    search_fields = ('title', 'course__title')
    ordering = ('course', 'order')


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'course', 'status', 'enrolled_at', 'dropped_at')
    list_filter = ('status',)
    search_fields = ('student__email', 'course__title')
    ordering = ('-enrolled_at',)
