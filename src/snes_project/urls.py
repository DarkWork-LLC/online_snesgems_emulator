"""Root URL configuration."""
from django.contrib import admin
from django.http import HttpResponse
from django.urls import include, path


def favicon(request):
    """204 No Content for browsers that request /favicon.ico when none is served."""
    return HttpResponse(status=204)


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('snes.urls')),
    path('wysiwyg/', include('wysiwyg.urls')),
    path('favicon.ico', favicon),
]
