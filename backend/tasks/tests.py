"""Testes unitários (mockados) do app de tarefas.

Usam ``SimpleTestCase`` — que **proíbe acesso ao banco de dados** — e
``unittest.mock`` para isolar cada unidade. O ORM, o logger e demais dependências
são substituídos por mocks, de modo que os testes exercitam apenas a lógica da
unidade sob teste (serializer / viewset), sem tocar em MySQL/SQLite.
"""
from unittest.mock import MagicMock, patch

from django.test import SimpleTestCase
from rest_framework import serializers

from .filters import TaskFilter
from .serializers import TaskSerializer
from .views import TaskViewSet


class TaskSerializerValidationTests(SimpleTestCase):
    """Regras de negócio do serializer — funções puras, sem banco."""

    def setUp(self):
        self.serializer = TaskSerializer()

    def test_validate_title_strips_whitespace(self):
        self.assertEqual(self.serializer.validate_title("  Estudar  "), "Estudar")

    def test_validate_title_rejects_empty(self):
        with self.assertRaises(serializers.ValidationError):
            self.serializer.validate_title("   ")

    def test_validate_title_rejects_too_long(self):
        with self.assertRaises(serializers.ValidationError):
            self.serializer.validate_title("x" * 201)

    def test_validate_description_rejects_too_long(self):
        with self.assertRaises(serializers.ValidationError):
            self.serializer.validate_description("x" * 2001)

    def test_validate_description_accepts_normal(self):
        self.assertEqual(self.serializer.validate_description("ok"), "ok")


class TaskViewSetQuerysetTests(SimpleTestCase):
    """get_queryset deve escopar por usuário (isolamento de dados)."""

    @patch("tasks.views.Task")
    def test_get_queryset_filters_by_current_user(self, MockTask):
        MockTask.objects.filter.return_value = "queryset-do-usuario"

        view = TaskViewSet()
        view.request = MagicMock()
        view.request.user = "usuario-sentinela"

        result = view.get_queryset()

        MockTask.objects.filter.assert_called_once_with(owner="usuario-sentinela")
        self.assertEqual(result, "queryset-do-usuario")

    @patch("tasks.views.Task")
    def test_get_queryset_returns_none_for_schema_generation(self, MockTask):
        MockTask.objects.none.return_value = "empty"

        view = TaskViewSet()
        view.swagger_fake_view = True

        self.assertEqual(view.get_queryset(), "empty")
        MockTask.objects.none.assert_called_once()
        MockTask.objects.filter.assert_not_called()


class TaskViewSetWriteTests(SimpleTestCase):
    """perform_create / perform_destroy delegam corretamente (com mocks)."""

    @patch("tasks.views.logger")
    def test_perform_create_sets_owner(self, _logger):
        view = TaskViewSet()
        view.request = MagicMock()
        view.request.user = "dono"

        serializer = MagicMock()
        serializer.save.return_value = MagicMock(id=1)

        view.perform_create(serializer)

        serializer.save.assert_called_once_with(owner="dono")

    @patch("tasks.views.logger")
    def test_perform_destroy_deletes_instance(self, _logger):
        view = TaskViewSet()
        view.request = MagicMock()

        instance = MagicMock(id=42)
        view.perform_destroy(instance)

        instance.delete.assert_called_once()


class TaskFilterConfigTests(SimpleTestCase):
    """O FilterSet expõe os filtros exigidos (status e data de criação)."""

    def test_declares_expected_filters(self):
        filters = set(TaskFilter.base_filters.keys())
        self.assertEqual(
            filters, {"completed", "created_after", "created_before"}
        )
