"""Django unit tests for the Rom model."""

from django.conf import settings
from django.test import TestCase
from pathlib import Path
from snes.models import Rom


class RomModelTests(TestCase):
    """Tests for the Rom data model."""

    def setUp(self):
        # Clean up any conflicting test.sfc records from earlier runs
        Rom.objects.filter(filename='test.sfc').delete()

        # Create test ROM file at the correct location on disk
        self.rom = Rom.objects.create(
            name='Test ROM',
            filename='test.sfc',
            file_size=1234,
        )
        self.test_file = settings.BASE_DIR / 'roms' / 'test.sfc'
        self.test_file.write_bytes(b'test-data')

    def tearDown(self):
        self.test_file.unlink(missing_ok=True)

    def test_create_rom(self):
        # Use unique filename to avoid conflicts with existing DB records
        rom = Rom.objects.create(
            name='Test ROM ' + str(self.rom.id),
            filename='test_' + str(self.rom.id) + '.sfc',
            file_size=1234,
        )
        self.assertEqual(rom.name, 'Test ROM ' + str(self.rom.id))
        self.assertEqual(rom.filename, 'test_' + str(self.rom.id) + '.sfc')
        self.assertEqual(rom.file_size, 1234)
        self.assertIsNotNone(rom.uploaded_at)
        self.assertEqual(str(rom), 'Test ROM ' + str(self.rom.id))

    def test_filename_unique(self):
        Rom.objects.create(name='Dup', filename='dup.sfc', file_size=1)
        with self.assertRaises(Exception):
            Rom.objects.create(name='Dup2', filename='dup.sfc', file_size=1)

    def test_rom_ordering(self):
        # Use unique filenames to avoid conflicts with existing DB records
        Rom.objects.create(name='Z Game ' + str(self.rom.id), filename='z_' + str(self.rom.id) + '.sfc', file_size=1)
        Rom.objects.create(name='A Game ' + str(self.rom.id), filename='a_' + str(self.rom.id) + '.sfc', file_size=1)
        roms = list(Rom.objects.all())
        a_rom = next(r for r in roms if r.filename == 'a_' + str(self.rom.id) + '.sfc')
        z_rom = next(r for r in roms if r.filename == 'z_' + str(self.rom.id) + '.sfc')
        self.assertEqual(a_rom.name, 'A Game ' + str(self.rom.id))
        self.assertEqual(z_rom.name, 'Z Game ' + str(self.rom.id))

    def test_rom_path_property(self):
        """rom_path resolves to the correct absolute path on disk."""
        self.assertTrue(self.test_file.exists(), f"Test file not found: {self.test_file}")
        self.assertEqual(Path(self.rom.rom_path), self.test_file)
        self.assertTrue(self.rom.rom_path.exists())