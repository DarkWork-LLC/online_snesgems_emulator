"""URL routes for the WYSIWYG app."""

from django.urls import path

from . import views

app_name = 'wysiwyg'

urlpatterns = [
    path('', views.page_list, name='list'),
    path('new/', views.page_editor, name='new'),
    path('<slug:slug>/edit/', views.page_editor, name='edit'),
    path('<slug:slug>/', views.page_view, name='view'),
    path('api/save/', views.api_save, name='api_save'),
    path('api/delete/', views.api_delete, name='api_delete'),
]
