"""Django admin registration for the WYSIWYG app."""

from django.contrib import admin

from .models import Page


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = ['title', 'slug', 'updated_at']
    list_filter = ['updated_at', 'created_at']
    search_fields = ['title', 'slug', 'content']
    prepopulated_fields = {'slug': ('title',)}
    fields = ['title', 'slug', 'content']
