from django_filters import rest_framework as filters

from .models import Task


class TaskFilter(filters.FilterSet):
    """Filtering for the task list.

    Supports the required filters: by status (``completed``) and by creation
    date (``created_after`` / ``created_before``, inclusive of the given day).
    """

    completed = filters.BooleanFilter(field_name="completed")
    created_after = filters.DateFilter(field_name="created_at", lookup_expr="date__gte")
    created_before = filters.DateFilter(field_name="created_at", lookup_expr="date__lte")

    class Meta:
        model = Task
        fields = ["completed", "created_after", "created_before"]
