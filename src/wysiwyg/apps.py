"""Django app config for the WYSIWYG rich-text editor."""

from django.apps import AppConfig


class WYSIWYGConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'wysiwyg'
    verbose_name = 'WYSIWYG Editor'
