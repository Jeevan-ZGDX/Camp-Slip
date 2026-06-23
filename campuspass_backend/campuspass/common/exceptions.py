from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


class CampusPassException(Exception):
    def __init__(self, detail, code=None, status_code=status.HTTP_400_BAD_REQUEST):
        self.detail = detail
        self.code = code
        self.status_code = status_code
        super().__init__(detail)


class NotFoundException(CampusPassException):
    def __init__(self, detail='Resource not found'):
        super().__init__(detail, status_code=status.HTTP_404_NOT_FOUND)


class PermissionDeniedException(CampusPassException):
    def __init__(self, detail='Permission denied'):
        super().__init__(detail, status_code=status.HTTP_403_FORBIDDEN)


class ValidationException(CampusPassException):
    def __init__(self, detail='Validation error'):
        super().__init__(detail, status_code=status.HTTP_400_BAD_REQUEST)


class ConflictException(CampusPassException):
    def __init__(self, detail='Resource conflict'):
        super().__init__(detail, status_code=status.HTTP_409_CONFLICT)


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        errors = response.data
        if isinstance(errors, dict):
            formatted_errors = {}
            for field, messages in errors.items():
                if isinstance(messages, list):
                    formatted_errors[field] = [str(m) for m in messages]
                else:
                    formatted_errors[field] = [str(messages)]
            response.data = {
                'success': False,
                'status_code': response.status_code,
                'errors': formatted_errors,
                'message': _get_error_summary(formatted_errors),
            }
        return response

    if isinstance(exc, CampusPassException):
        return Response(
            {
                'success': False,
                'status_code': exc.status_code,
                'message': exc.detail,
                'errors': {},
            },
            status=exc.status_code,
        )

    return response


def _get_error_summary(errors):
    for field, messages in errors.items():
        if messages:
            return messages[0]
    return 'An error occurred'
