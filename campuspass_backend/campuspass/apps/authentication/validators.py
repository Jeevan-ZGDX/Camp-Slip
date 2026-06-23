import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


class UppercaseValidator:
    def validate(self, password, user=None):
        if not re.findall('[A-Z]', password):
            raise ValidationError(
                _('Password must contain at least one uppercase letter.'),
                code='password_no_upper',
            )

    def get_help_text(self):
        return _('Your password must contain at least one uppercase letter.')


class SpecialCharValidator:
    def validate(self, password, user=None):
        if not re.findall('[!@#$%^&*(),.?":{}|<>_\\-]', password):
            raise ValidationError(
                _('Password must contain at least one special character.'),
                code='password_no_special',
            )

    def get_help_text(self):
        return _('Your password must contain at least one special character.')


class PhoneNumberValidator:
    @staticmethod
    def validate_phone(phone):
        pattern = r'^\+?[1-9]\d{9,14}$'
        if not re.match(pattern, phone):
            raise ValidationError('Invalid phone number format')
        return phone


class EmailDomainValidator:
    @staticmethod
    def validate_email(email):
        allowed_domains = ['.edu', '.ac.in']
        if not any(email.endswith(domain) for domain in allowed_domains):
            raise ValidationError(
                'Only educational email addresses are allowed'
            )
        return email
