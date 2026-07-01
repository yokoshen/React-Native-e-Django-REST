"""Custom DRF exception handler.

Wraps DRF's default handler to produce a consistent, readable error envelope and
to log unexpected 5xx errors so they are easy to spot while debugging.
"""
import logging

from rest_framework.views import exception_handler

logger = logging.getLogger("todo")


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        # Unhandled exception -> DRF returns None and would surface a 500.
        # Log it with the view context so it is traceable in the console.
        view = context.get("view")
        logger.exception("Unhandled error in %s", view.__class__.__name__ if view else "?")
        return response

    detail = response.data
    # Normalise into {"detail": ..., "errors": {...}} so clients can rely on it.
    if isinstance(detail, dict) and "detail" in detail and len(detail) == 1:
        payload = {"detail": detail["detail"], "errors": None}
    else:
        payload = {
            "detail": "Não foi possível processar a requisição. Verifique os campos.",
            "errors": detail,
        }

    response.data = payload
    return response
