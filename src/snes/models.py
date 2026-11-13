"""Data model for the SNES ROM library served by this app."""


from django.conf import settings
from django.db import models


class Rom(models.Model):
    """Metadata + file for one Super Nintendo cartridge image (.smc / .sfc)."""

    name = models.CharField(max_length=200, help_text='Display name shown in the UI.')
    filename = models.CharField(max_length=255, unique=True, help_text='Filename on disk.')
    file_size = models.BigIntegerField(help_text='Size of the ROM in bytes.')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']
        verbose_name_plural = 'ROMs'

    def __str__(self):
        return self.name

    @property
    def rom_path(self):
        """Absolute path to the ROM file on disk."""
        return settings.BASE_DIR / 'roms' / self.filename

    def delete(self, *args, **kwargs):
        # Best-effort removal of the file when the record is deleted.
        try:
            self.rom_path.unlink()
        except FileNotFoundError:
            pass
        super().delete(*args, **kwargs)
