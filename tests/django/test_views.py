"""Django unit tests for the SNES views."""

# Django does not accept empty ALLOWED_HOSTS for tests, so we configure it
# to 'testserver' so the test client can issue requests without errors.
from django.conf import settings

settings.ALLOWED_HOSTS = ['testserver']

from django.test import TestCase  # noqa: E402
from django.urls import reverse  # noqa: E402
from snes.models import Rom  # noqa: E402


class ViewsTests(TestCase):
    """Tests for the SNES emulator views."""

    def setUp(self):
        # Use a unique filename to avoid conflicts with existing DB records
        filename = 'test_' + str(self._testMethodName) + '.sfc'
        Rom.objects.filter(filename=filename).delete()
        self.rom = Rom.objects.create(
            name='Metal Marines (USA) Test ' + str(self._testMethodName),
            filename=filename,
            file_size=1572864,
        )
        # Create the test ROM file on disk at the same location the views serve from
        import os
        test_rom_dir = settings.BASE_DIR / 'roms'
        os.makedirs(test_rom_dir, exist_ok=True)
        self.test_file = os.path.join(test_rom_dir, 'test_' + str(self._testMethodName) + '.sfc')
        with open(self.test_file, 'wb') as f:
            f.write(b'X' * 1572864)
        settings.ALLOWED_HOSTS = ['testserver']

    def test_index_returns_200(self):
        response = self.client.get(reverse('snes:index'))
        self.assertEqual(response.status_code, 200)
        # ROM library cards are rendered by JS from /api/roms/ endpoint
        roms_response = self.client.get(reverse('snes:api_roms'))
        self.assertEqual(roms_response.status_code, 200)
        data = roms_response.json()
        self.assertIn('roms', data)
        filenames = [r['filename'] for r in data['roms']]
        self.assertIn('Metal Marines (USA).sfc', filenames)

    def test_api_roms_returns_json(self):
        response = self.client.get(reverse('snes:api_roms'))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('roms', data)
        filenames = [r['filename'] for r in data['roms']]
        self.assertIn('Metal Marines (USA).sfc', filenames)

    def test_api_rom_stream_returns_file(self):
        response = self.client.get(reverse('snes:api_rom_stream', args=[self.rom.id]))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get('Content-Type'), 'application/octet-stream')
        self.assertEqual(response.get('Content-Length'), str(1572864))
        # Check streaming content length
        self.assertEqual(len(b''.join(response.streaming_content)), 1572864)

    def test_api_rom_stream_404(self):
        response = self.client.get(reverse('snes:api_rom_stream', args=[99999]))
        self.assertEqual(response.status_code, 404)
