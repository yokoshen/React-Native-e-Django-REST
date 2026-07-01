import logging

from rest_framework import viewsets

from .filters import TaskFilter
from .models import Task
from .serializers import TaskSerializer

logger = logging.getLogger("todo")


class TaskViewSet(viewsets.ModelViewSet):
    """CRUD for tasks.

    Data isolation: every query is scoped to the authenticated user, so a user
    can only see and mutate their own tasks. Ordering defaults to newest first
    and can be overridden with ``?ordering=created_at``.
    """

    serializer_class = TaskSerializer
    filterset_class = TaskFilter
    ordering_fields = ["created_at", "updated_at", "title", "completed"]
    ordering = ["-created_at"]

    def get_queryset(self):
        # Return an empty queryset for schema generation (no authed user).
        if getattr(self, "swagger_fake_view", False):
            return Task.objects.none()
        return Task.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        task = serializer.save(owner=self.request.user)
        logger.info("Task created id=%s by user=%s", task.id, self.request.user)

    def perform_destroy(self, instance):
        logger.info("Task deleted id=%s by user=%s", instance.id, self.request.user)
        instance.delete()
