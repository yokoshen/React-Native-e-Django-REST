#!/usr/bin/env bash
set -e

# Wait for MySQL to accept connections before running migrations.
if [ "${USE_SQLITE:-0}" != "1" ]; then
  echo "Aguardando MySQL em ${MYSQL_HOST:-db}:${MYSQL_PORT:-3306}..."
  until python -c "import socket,sys; s=socket.socket(); s.settimeout(2); \
    s.connect(('${MYSQL_HOST:-db}', int('${MYSQL_PORT:-3306}'))); s.close()" 2>/dev/null; do
    sleep 1
  done
  echo "MySQL disponível."
fi

echo "Aplicando migrações..."
python manage.py migrate --noinput

echo "Coletando arquivos estáticos..."
python manage.py collectstatic --noinput >/dev/null 2>&1 || true

if [ "${RUN_SEED:-0}" = "1" ]; then
  echo "Populando dados de exemplo (seed_demo)..."
  python manage.py seed_demo
fi

if [ "${DJANGO_DEV:-1}" = "1" ]; then
  echo "Iniciando servidor de desenvolvimento em 0.0.0.0:8000"
  exec python manage.py runserver 0.0.0.0:8000
else
  echo "Iniciando gunicorn em 0.0.0.0:8000"
  exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3
fi
