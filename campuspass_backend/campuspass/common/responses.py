from rest_framework.response import Response
from rest_framework import status


def api_response(data=None, message='Success', success=True, status_code=status.HTTP_200_OK, meta=None):
    response_data = {
        'success': success,
        'status_code': status_code,
        'message': message,
        'data': data,
    }
    if meta:
        response_data['meta'] = meta
    return Response(response_data, status=status_code)


def success_response(data=None, message='Success', status_code=status.HTTP_200_OK, meta=None):
    return api_response(data=data, message=message, success=True, status_code=status_code, meta=meta)


def created_response(data=None, message='Created successfully'):
    return api_response(data=data, message=message, success=True, status_code=status.HTTP_201_CREATED)


def error_response(message='Error', errors=None, status_code=status.HTTP_400_BAD_REQUEST):
    return Response(
        {
            'success': False,
            'status_code': status_code,
            'message': message,
            'errors': errors or {},
            'data': None,
        },
        status=status_code,
    )


def paginated_response(data, paginator):
    return Response(
        {
            'success': True,
            'status_code': status.HTTP_200_OK,
            'message': 'Success',
            'data': data,
            'meta': {
                'count': paginator.page.paginator.count,
                'page': paginator.page.number,
                'page_size': paginator.page.paginator.per_page,
                'total_pages': paginator.page.paginator.num_pages,
                'next': paginator.get_next_link(),
                'previous': paginator.get_previous_link(),
            },
        }
    )
