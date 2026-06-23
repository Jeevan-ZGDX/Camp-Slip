from rest_framework.renderers import JSONRenderer


class CampusPassRenderer(JSONRenderer):
    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = renderer_context.get('response') if renderer_context else None
        status_code = response.status_code if response else 200

        if data is not None and 'success' not in data:
            if status_code < 400:
                data = {
                    'success': True,
                    'status_code': status_code,
                    'message': 'Success',
                    'data': data,
                }
            else:
                errors = data if isinstance(data, dict) else {'non_field_errors': data}
                data = {
                    'success': False,
                    'status_code': status_code,
                    'message': 'Error',
                    'errors': errors,
                    'data': None,
                }

        return super().render(data, accepted_media_type, renderer_context)
