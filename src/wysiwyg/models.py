"""Data model for the WYSIWYG rich-text pages."""

from django.db import models


class Page(models.Model):
    """A single rich-text page edited through the WYSIWYG editor."""

    title = models.CharField(max_length=200, help_text='Display title of the page.')
    slug = models.SlugField(max_length=200, unique=True, help_text='URL-friendly identifier.')
    content = models.TextField(
        blank=True,
        default='',
        help_text='Rich HTML content produced by the editor.',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        verbose_name = 'Page'
        verbose_name_plural = 'Pages'

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        from django.urls import reverse
        return reverse('wysiwyg:view', kwargs={'slug': self.slug})
