"""Testes unitários (mockados) do app de contas/autenticação.

Usam ``SimpleTestCase`` (sem acesso a banco) e ``unittest.mock`` para isolar a
lógica de serializers e views. O ORM (``User.objects``), o envio de e-mail
(``send_mail``) e o gerador de token são todos mockados.
"""
from unittest.mock import MagicMock, patch

from django.core.exceptions import ValidationError as DjangoValidationError
from django.test import SimpleTestCase
from rest_framework import serializers

from .serializers import RegisterSerializer
from .views import LogoutView, PasswordResetConfirmView, PasswordResetRequestView


class RegisterSerializerTests(SimpleTestCase):
    def setUp(self):
        self.serializer = RegisterSerializer()

    @patch("accounts.serializers.User")
    def test_validate_username_ok_when_unique(self, MockUser):
        MockUser.objects.filter.return_value.exists.return_value = False
        self.assertEqual(self.serializer.validate_username("  carol "), "carol")

    @patch("accounts.serializers.User")
    def test_validate_username_rejects_duplicate(self, MockUser):
        MockUser.objects.filter.return_value.exists.return_value = True
        with self.assertRaises(serializers.ValidationError):
            self.serializer.validate_username("carol")

    @patch("accounts.serializers.User")
    def test_validate_email_normalises_and_checks_unique(self, MockUser):
        MockUser.objects.filter.return_value.exists.return_value = False
        self.assertEqual(
            self.serializer.validate_email("  Carol@Example.com "),
            "carol@example.com",
        )

    @patch("accounts.serializers.User")
    def test_validate_email_rejects_duplicate(self, MockUser):
        MockUser.objects.filter.return_value.exists.return_value = True
        with self.assertRaises(serializers.ValidationError):
            self.serializer.validate_email("carol@example.com")

    @patch("accounts.serializers.validate_password")
    def test_validate_password_wraps_django_errors(self, mock_validate):
        mock_validate.side_effect = DjangoValidationError(["senha fraca"])
        with self.assertRaises(serializers.ValidationError):
            self.serializer.validate_password("123")

    @patch("accounts.serializers.validate_password")
    def test_validate_password_accepts_strong(self, mock_validate):
        mock_validate.return_value = None
        self.assertEqual(self.serializer.validate_password("Senha@12345"), "Senha@12345")

    @patch("accounts.serializers.User")
    def test_create_delegates_to_create_user(self, MockUser):
        MockUser.objects.create_user.return_value = "novo-usuario"
        result = self.serializer.create(
            {"username": "carol", "email": "carol@example.com", "password": "Senha@12345"}
        )
        MockUser.objects.create_user.assert_called_once_with(
            username="carol", email="carol@example.com", password="Senha@12345"
        )
        self.assertEqual(result, "novo-usuario")


class LogoutViewTests(SimpleTestCase):
    @patch("accounts.views.RefreshToken")
    def test_logout_blacklists_refresh_token(self, MockRefreshToken):
        view = LogoutView()
        serializer = MagicMock()
        serializer.is_valid.return_value = True
        serializer.validated_data = {"refresh": "tok"}
        view.get_serializer = MagicMock(return_value=serializer)

        request = MagicMock()
        response = view.post(request)

        MockRefreshToken.assert_called_once_with("tok")
        MockRefreshToken.return_value.blacklist.assert_called_once()
        self.assertEqual(response.status_code, 205)


class PasswordResetRequestViewTests(SimpleTestCase):
    def _make_view(self, email):
        view = PasswordResetRequestView()
        serializer = MagicMock()
        serializer.is_valid.return_value = True
        serializer.validated_data = {"email": email}
        view.get_serializer = MagicMock(return_value=serializer)
        return view

    @patch("accounts.views.send_mail")
    @patch("accounts.views.default_token_generator")
    @patch("accounts.views.urlsafe_base64_encode", return_value="uid123")
    @patch("accounts.views.User")
    def test_sends_email_when_user_exists(
        self, MockUser, _encode, mock_tokgen, mock_send
    ):
        MockUser.objects.filter.return_value.first.return_value = MagicMock(
            pk=1, username="carol"
        )
        mock_tokgen.make_token.return_value = "tok"

        response = self._make_view("carol@example.com").post(MagicMock())

        self.assertEqual(response.status_code, 200)
        mock_send.assert_called_once()

    @patch("accounts.views.send_mail")
    @patch("accounts.views.User")
    def test_generic_response_when_user_missing(self, MockUser, mock_send):
        MockUser.objects.filter.return_value.first.return_value = None

        response = self._make_view("naoexiste@example.com").post(MagicMock())

        # Resposta genérica (200) e nenhum e-mail enviado -> não vaza existência.
        self.assertEqual(response.status_code, 200)
        mock_send.assert_not_called()


class PasswordResetConfirmViewTests(SimpleTestCase):
    def _make_view(self, data):
        view = PasswordResetConfirmView()
        serializer = MagicMock()
        serializer.is_valid.return_value = True
        serializer.validated_data = data
        view.get_serializer = MagicMock(return_value=serializer)
        return view

    @patch("accounts.views.default_token_generator")
    @patch("accounts.views.User")
    @patch("accounts.views.urlsafe_base64_decode", return_value=b"1")
    def test_resets_password_with_valid_token(self, _decode, MockUser, mock_tokgen):
        user = MagicMock(username="carol")
        MockUser.objects.get.return_value = user
        mock_tokgen.check_token.return_value = True

        data = {"uid": "uid123", "token": "tok", "new_password": "NovaSenha@999"}
        response = self._make_view(data).post(MagicMock())

        self.assertEqual(response.status_code, 200)
        user.set_password.assert_called_once_with("NovaSenha@999")
        user.save.assert_called_once()

    @patch("accounts.views.default_token_generator")
    @patch("accounts.views.User")
    @patch("accounts.views.urlsafe_base64_decode", return_value=b"1")
    def test_rejects_invalid_token(self, _decode, MockUser, mock_tokgen):
        user = MagicMock(username="carol")
        MockUser.objects.get.return_value = user
        mock_tokgen.check_token.return_value = False

        data = {"uid": "uid123", "token": "ruim", "new_password": "NovaSenha@999"}
        response = self._make_view(data).post(MagicMock())

        self.assertEqual(response.status_code, 400)
        user.set_password.assert_not_called()
