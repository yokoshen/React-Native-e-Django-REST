from django.contrib import admin

from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "owner", "completed", "created_at")
    list_filter = ("completed", "created_at")
    search_fields = ("title", "description", "owner__username")
    list_select_related = ("owner",)
    ordering = ("-created_at",)
