# ── Stage: production image ────────────────────────────────────────────────────
# python:3.13-slim keeps the image small while matching the dev Python version.
FROM python:3.13-slim

# psycopg2-binary ships a pre-built wheel, so libpq-dev is only needed when
# pip falls back to a source build (e.g. no matching wheel for this platform).
# Including it keeps the image portable across architectures.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies before copying application code so that Docker
# can cache this layer and skip reinstallation on code-only changes.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Collect static files into STATIC_ROOT so WhiteNoise can serve them.
# SECRET_KEY is provided as a dummy value solely to satisfy Django's startup
# check during build — it is never used at runtime.
RUN SECRET_KEY=build-time-placeholder python manage.py collectstatic --noinput

EXPOSE 8000

# Migrate then start Gunicorn. Running migrations on startup is safe for a
# single-instance deployment. For multi-instance, extract the migrate step into
# a separate Railway "start command" pre-deploy hook.
CMD ["sh", "-c", "python manage.py migrate --noinput && gunicorn lms.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120 --access-logfile -"]
