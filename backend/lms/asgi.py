"""ASGI entry point — enables async views and lays the groundwork for WebSockets."""
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lms.settings')
application = get_asgi_application()
