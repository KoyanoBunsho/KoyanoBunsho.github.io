import json
from pathlib import Path
import runpy
import tempfile
import types
import unittest
from unittest.mock import patch


class TalkMapGenerationTest(unittest.TestCase):
    def test_regeneration_changes_only_data_and_preserves_security_fixes(self):
        label = '<img src=x onerror=alert(1)>'
        geocoded = []

        def geocode(location):
            geocoded.append(location)
            return types.SimpleNamespace(latitude=35.0, longitude=139.0)

        modules = {
            'geopy': types.SimpleNamespace(Nominatim=lambda **kwargs: types.SimpleNamespace(geocode=geocode)),
            'geopy.extra': types.ModuleType('geopy.extra'),
            'geopy.extra.rate_limiter': types.SimpleNamespace(RateLimiter=lambda call, **kwargs: call),
        }
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / '_talks').mkdir()
            (root / 'talkmap' / 'leaflet_dist').mkdir(parents=True)
            for filename in ['one.md', 'duplicate.md']:
                (root / '_talks' / filename).write_text('---\nlocation: "' + label + '"\n---\n')
            (root / '_talks' / 'no-location.md').write_text('---\ntitle: "No location"\n---\n')
            template = root / 'talkmap' / 'map.html'
            library = root / 'talkmap' / 'leaflet_dist' / 'leaflet.js'
            template.write_text('reviewed HTTPS and textContent template')
            library.write_text('reviewed Leaflet library')
            script = root / 'talkmap.py'
            script.write_text((Path(__file__).resolve().parents[1] / 'talkmap.py').read_text())
            with patch.dict('sys.modules', modules):
                runpy.run_path(str(script))

            output = (root / 'talkmap' / 'org-locations.js').read_text()
            points = json.loads(output.removeprefix('var addressPoints = ').removesuffix(';\n'))
            self.assertEqual(points, [[label, 35.0, 139.0]])
            self.assertEqual(geocoded, [label])
            self.assertEqual(template.read_text(), 'reviewed HTTPS and textContent template')
            self.assertEqual(library.read_text(), 'reviewed Leaflet library')


if __name__ == '__main__':
    unittest.main()
