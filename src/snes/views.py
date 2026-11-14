"""Django views for the SNES emulator web app.

The emulation itself runs client-side in the browser (Snes9x compiled to
WebAssembly).  These views are responsible for:
  * serving the single-page UI,
  * listing the ROMs registered in the app,
  * streaming a ROM's bytes to the browser so they can be handed to the
    WebAssembly engine (which expects the raw cartridge image).
"""


from django.http import FileResponse, JsonResponse
from django.shortcuts import render

from .models import Rom


# --------------------------------------------------------------------------- #
# Pages
# --------------------------------------------------------------------------- #


def index(request):
    """Render the emulator dashboard page."""
    roms = Rom.objects.all()
    return render(request, 'snes/index.html', {'roms': roms})


# --------------------------------------------------------------------------- #
# API: ROM library
# --------------------------------------------------------------------------- #


def api_roms(request):
    """Return the registered ROMs as JSON."""
    roms = [
        {
            'id': rom.id,
            'name': rom.name,
            'filename': rom.filename,
            'size': rom.file_size,
            'file_size': rom.file_size,
        }
        for rom in Rom.objects.all()
    ]
    return JsonResponse({'roms': roms})


def api_rom_stream(request, rom_id):
    """Stream the raw ROM bytes (application/octet-stream) to the caller."""
    try:
        rom = Rom.objects.get(id=rom_id)
    except Rom.DoesNotExist:
        return JsonResponse({'error': 'ROM not found.'}, status=404)

    response = FileResponse(
        open(rom.rom_path, 'rb'),
        content_type='application/octet-stream',
        status=200,
    )
    response['Content-Disposition'] = f'attachment; filename="{rom.filename}"'
    return response
