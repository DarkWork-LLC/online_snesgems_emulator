"""Django views for the WYSIWYG rich-text editor.

Endpoints:
    GET  /wysiwyg/              -> page list
    GET  /wysiwyg/new/          -> new editor
    GET  /wysiwyg/<slug>/edit/  -> edit existing page
    GET  /wysiwyg/<slug>/       -> public read-only view
    POST /wysiwyg/api/save/     -> save page content (JSON)
    POST /wysiwyg/api/delete/   -> delete a page (JSON)
"""

import json
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import Page


# --------------------------------------------------------------------------- #
# Pages
# --------------------------------------------------------------------------- #


def page_list(request):
    """List all pages, most recently updated first."""
    pages = Page.objects.all()
    return render(request, 'wysiwyg/list.html', {'pages': pages})


def page_editor(request, slug=None):
    """Rich-text editor for creating or editing a page."""
    page = None
    if slug:
        page = get_object_or_404(Page, slug=slug)
    return render(request, 'wysiwyg/editor.html', {'page': page})


def page_view(request, slug):
    """Public read-only rendering of a page."""
    page = get_object_or_404(Page, slug=slug)
    return render(request, 'wysiwyg/view.html', {'page': page})


# --------------------------------------------------------------------------- #
# JSON API (used by the editor frontend)
# --------------------------------------------------------------------------- #


@csrf_exempt
@require_http_methods(['POST'])
def api_save(request):
    """Create or update a page from JSON body {title, slug?, content?}."""
    try:
        data = json.loads(request.body.decode('utf-8'))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)

    title = (data.get('title') or '').strip()
    slug = (data.get('slug') or '').strip() or None
    content = data.get('content', '')

    if not title:
        return JsonResponse({'error': 'Title is required.'}, status=400)

    page_id = data.get('id')
    if page_id:
        page = get_object_or_404(Page, id=page_id)
        page.title = title
        if slug:
            page.slug = slug
        page.content = content
        page.save()
    else:
        if not slug:
            # derive slug from title
            from django.utils.text import slugify
            slug = slugify(title)
            # ensure uniqueness
            base = slug
            n = 1
            while Page.objects.filter(slug=slug).exists():
                slug = f'{base}-{n}'
                n += 1
        page = Page.objects.create(title=title, slug=slug, content=content)

    return JsonResponse({
        'id': page.id,
        'title': page.title,
        'slug': page.slug,
        'content': page.content,
        'url': page.get_absolute_url(),
    })


@csrf_exempt
@require_http_methods(['POST'])
def api_delete(request):
    """Delete a page by id. JSON body {id}."""
    try:
        data = json.loads(request.body.decode('utf-8'))
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({'error': 'Invalid JSON.'}, status=400)

    page_id = data.get('id')
    if not page_id:
        return JsonResponse({'error': 'id is required.'}, status=400)

    page = get_object_or_404(Page, id=page_id)
    page.delete()
    return JsonResponse({'ok': True})
