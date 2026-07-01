"""Populate the database with a superuser and demo accounts + sample tasks.

Idempotent: running it multiple times will not create duplicates. Credentials
come from environment variables so they can be customised per environment.

    python manage.py seed_demo
"""
import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from tasks.models import Task

User = get_user_model()

DEMO_USERS = [
    {
        "username": "alice",
        "email": "alice@example.com",
        "password": "Senha@12345",
        "tasks": [
            ("Comprar café", "Grãos para a semana", False),
            ("Enviar relatório", "Fechar o relatório mensal", False),
            ("Pagar contas", "Água e luz", True),
        ],
    },
    {
        "username": "bob",
        "email": "bob@example.com",
        "password": "Senha@12345",
        "tasks": [
            ("Estudar Django", "Terminar o tutorial de DRF", False),
            ("Correr 5km", "Treino de terça", True),
        ],
    },
]


class Command(BaseCommand):
    help = "Cria superusuário e contas de teste com tarefas de exemplo (idempotente)."

    @transaction.atomic
    def handle(self, *args, **options):
        self._create_superuser()
        for spec in DEMO_USERS:
            self._create_demo_user(spec)
        self.stdout.write(self.style.SUCCESS("Seed concluído."))

    def _create_superuser(self):
        username = os.environ.get("DJANGO_SUPERUSER_USERNAME", "admin")
        email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "admin@example.com")
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD", "admin12345")

        user, created = User.objects.get_or_create(
            username=username,
            defaults={"email": email, "is_staff": True, "is_superuser": True},
        )
        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(f"  superusuário criado: {username} / {password}")
        else:
            self.stdout.write(f"  superusuário já existe: {username}")

    def _create_demo_user(self, spec):
        user, created = User.objects.get_or_create(
            username=spec["username"],
            defaults={"email": spec["email"]},
        )
        if created:
            user.set_password(spec["password"])
            user.save()
            self.stdout.write(
                f"  usuário demo: {spec['username']} / {spec['password']}"
            )

        # Only seed tasks the first time (avoid duplicating on re-run).
        if not user.tasks.exists():
            for title, description, completed in spec["tasks"]:
                Task.objects.create(
                    owner=user,
                    title=title,
                    description=description,
                    completed=completed,
                )
