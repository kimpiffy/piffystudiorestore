import json
import os
import subprocess
import sys
from pathlib import Path
from tempfile import TemporaryDirectory

from django.conf import settings
from django.core.management import call_command
from django.test import SimpleTestCase, override_settings


BASE_DIR = Path(__file__).resolve().parent.parent
SETTINGS_PROBE = (
    "import json; import config.settings as settings; "
    "print(json.dumps({'debug': settings.DEBUG, 'secret_key': settings.SECRET_KEY}))"
)


class ProductionSettingsTests(SimpleTestCase):
    def load_production_settings(self, **overrides):
        env = {
            "PATH": os.environ.get("PATH", ""),
            "RENDER": "1",
            "DEBUG": "true",
            "DATABASE_URL": "sqlite:///:memory:",
        }
        env.update(overrides)
        return subprocess.run(
            [sys.executable, "-c", SETTINGS_PROBE],
            cwd=BASE_DIR,
            env=env,
            check=False,
            capture_output=True,
            text=True,
        )

    def test_render_forces_debug_off_and_uses_django_secret_key(self):
        result = self.load_production_settings(
            DJANGO_SECRET_KEY="configured-test-secret",
        )

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(
            json.loads(result.stdout),
            {"debug": False, "secret_key": "configured-test-secret"},
        )

    def test_render_accepts_existing_secret_key_during_migration(self):
        result = self.load_production_settings(SECRET_KEY="legacy-test-secret")

        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(
            json.loads(result.stdout),
            {"debug": False, "secret_key": "legacy-test-secret"},
        )

    def test_production_without_a_secret_key_fails_to_start(self):
        result = self.load_production_settings()

        self.assertNotEqual(result.returncode, 0)
        self.assertIn("ImproperlyConfigured", result.stderr)

    def test_render_manifest_uses_secure_production_settings(self):
        manifest = (BASE_DIR / "render.yaml").read_text()

        self.assertIn("key: DJANGO_SECRET_KEY", manifest)
        self.assertNotIn("key: SECRET_KEY", manifest)
        self.assertIn('key: DEBUG\n        value: "False"', manifest)


class ProductionStaticCollectionTests(SimpleTestCase):
    def test_collectstatic_succeeds_with_production_manifest_storage(self):
        with TemporaryDirectory(prefix="piffy-collectstatic-test-") as temp_dir:
            static_root = Path(temp_dir) / "staticfiles"
            staticfiles_storage = {
                "BACKEND": (
                    "whitenoise.storage."
                    "CompressedManifestStaticFilesStorage"
                ),
            }
            storages = {
                **settings.STORAGES,
                "staticfiles": staticfiles_storage,
            }

            with override_settings(
                DEBUG=False,
                STATIC_ROOT=static_root,
                STORAGES=storages,
            ):
                call_command("collectstatic", interactive=False, verbosity=0)
