"""Seed the Rom table from the files in roms."""

from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand

from snes.models import Rom


class Command(BaseCommand):
    help = 'Create/update Rom rows for every ROM file in roms'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Delete existing ROM rows before seeding',
        )

    def handle(self, *args, **options):
        roms_dir = settings.BASE_DIR / 'roms'
        self.stderr.write(f'Seeding ROMs from: {roms_dir}')

        if options['reset']:
            Rom.objects.all().delete()
            self.stderr.write('Deleted existing ROM rows.')

        created = 0
        updated = 0
        for rom_file in sorted(roms_dir.iterdir()):
            if not rom_file.is_file():
                continue
            # Strip a leading directory path if present, keep just the file name.
            filename = rom_file.name
            try:
                existing = Rom.objects.get(filename=filename)
                if existing.file_size != rom_file.stat().st_size:
                    existing.file_size = rom_file.stat().st_size
                    existing.save()
                    updated += 1
                    self.stderr.write(f'Updated {filename}')
                else:
                    self.stderr.write(f'Already present: {filename}')
            except Rom.DoesNotExist:
                Rom.objects.create(
                    name=rom_file.stem,
                    filename=filename,
                    file_size=rom_file.stat().st_size,
                )
                created += 1
                self.stderr.write(f'Created {filename}')

        self.stdout.write(self.style.SUCCESS(
            f'Seed complete: {created} created, {updated} updated, '
            f'{Rom.objects.count()} total'
        ))
