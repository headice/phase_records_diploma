from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is None:
        return Response({"detail": str(exc)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    data = {}
    if isinstance(response.data, dict):
        detail = response.data.get("detail")
        if detail:
            data["detail"] = detail
        errors = {k: v for k, v in response.data.items() if k != "detail"}
        if errors:
            data["errors"] = errors
    else:
        data["detail"] = response.data

    return Response(data, status=response.status_code)
