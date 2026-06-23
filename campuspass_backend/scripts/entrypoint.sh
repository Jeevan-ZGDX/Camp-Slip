#!/bin/bash
set -e

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput --clear

echo "Creating default admin user (if not exists)..."
python manage.py shell -c "
from django.contrib.auth import get_user_model;
User = get_user_model();
if not User.objects.filter(email='admin@campuspass.edu').exists():
    User.objects.create_superuser(
        email='admin@campuspass.edu',
        username='admin',
        password='Admin@123',
        first_name='Admin',
        last_name='User',
        role='ADMIN'
    )
    print('Default admin created: admin@campuspass.edu / Admin@123')
else:
    print('Admin user already exists')
"

echo "Starting server..."
exec "$@"
