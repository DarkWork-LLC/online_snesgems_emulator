"""Root URL configuration."""
import sys

from django.contrib import admin
from django.http import HttpResponse
from django.urls import include, path, re_path

from django.conf import settings
from django.views.static import serve as static_serve


def favicon(request):
    """204 No Content for browsers that request /favicon.ico when none is served."""
    return HttpResponse(status=204)


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('snes.urls')),
    path('wysiwyg/', include('wysiwyg.urls')),
    path('favicon.ico', favicon),
]

# Fallback: serve static files directly through Django when the frontend web
# server (nginx on PythonAnywhere / uWSGI) is not configured to serve them
# from STATIC_ROOT.  Only active when DEBUG=True and NOT under runserver
# (runserver already has its own static-file serving).
if settings.DEBUG and 'runserver' not in sys.argv:
    urlpatterns += [
        re_path(
            r'^static/(?P<path>.*)$',
            static_serve,
            {'document_root': settings.STATIC_ROOT, 'show_indexes': False},
        ),
    ]
