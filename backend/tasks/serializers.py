from rest_framework import serializers

from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "completed",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_title(self, value):
        """Business rule: title cannot be empty or whitespace-only."""
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("O título não pode ficar vazio.")
        if len(cleaned) > 200:
            raise serializers.ValidationError(
                "O título deve ter no máximo 200 caracteres."
            )
        return cleaned

    def validate_description(self, value):
        if value and len(value) > 2000:
            raise serializers.ValidationError(
                "A descrição deve ter no máximo 2000 caracteres."
            )
        return value
