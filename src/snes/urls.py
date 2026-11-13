"""URL routes for the snes app."""
from django.urls import path
from . import views

app_name = 'snes'

urlpatterns = [
    path('', views.index, name='index'),
    path('api/roms/', views.api_roms, name='api_roms'),
    path('api/roms/<int:rom_id>/stream/', views.api_rom_stream, name='api_rom_stream'),
]
