#!/bin/bash
set -e

echo "Starting DECO3801-PowerScope setup..."

# 1. Ensure .env exists
if [ ! -f .env ]; then
    echo "No .env file found. Copying from .env.example..."
    cp .env.example .env
    echo "Created .env (using defaults from .env.example)."
else
    echo ".env file already exists, skipping copy."
fi

# 2. Start Docker
echo "Running docker compose up..."
docker compose up -d --build

# 3. Wait for Postgres
echo "Waiting for Postgres to be ready..."
until docker compose exec -T postgres pg_isready -U django -d django_db > /dev/null 2>&1; do
    sleep 2
done
echo "Postgres is ready."

# 4. Django migrations
echo "Running Django migrations..."
docker compose exec -T django python manage.py migrate

# 5. Collect static files
echo "Collecting static files..."
docker compose exec -T django python manage.py collectstatic --noinput

# 6. Create admin user if missing
echo "Checking for admin user..."
if ! docker compose exec -T django python manage.py shell -c \
  "from django.contrib.auth.models import User; exit(0) if User.objects.filter(username='admin').exists() else exit(1)"; then
  echo "Creating default admin user (username=admin, password=adminpass)..."
  docker compose exec -T django python manage.py createsuperuser \
    --username admin --email admin@example.com --noinput
  docker compose exec -T django python manage.py shell -c \
    "from django.contrib.auth.models import User; u=User.objects.get(username='admin'); u.set_password('adminpass'); u.save()"
  echo "Default admin user created (username=admin, password=adminpass)."
else
  echo "Admin user already exists, skipping."
fi

echo "Setup complete! Open: http://localhost:8080/"