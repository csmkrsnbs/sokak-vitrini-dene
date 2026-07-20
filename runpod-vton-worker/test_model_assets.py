import os
import tempfile
import unittest
from pathlib import Path

from model_assets import DWPOSE_FILENAMES, find_cached_model, prepare_weights_dir


def _write(path: Path, value: bytes = b"test") -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(value)
    return path


class ModelAssetsTests(unittest.TestCase):
    def test_prefers_exact_cached_revision(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            expected = _write(
                root
                / "models--fashn-ai--fashn-vton-1.5"
                / "snapshots"
                / "expected-revision"
                / "model.safetensors"
            )
            _write(
                root
                / "models--fashn-ai--fashn-vton-1.5"
                / "snapshots"
                / "other-revision"
                / "model.safetensors"
            )

            actual = find_cached_model(
                cache_root=root,
                repo_id="fashn-ai/fashn-vton-1.5",
                revision="expected-revision",
            )

            self.assertEqual(actual, expected)

    def test_builds_runtime_layout_with_symlinks(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            cache_root = root / "cache"
            assets_root = root / "assets"
            weights_root = root / "weights"
            cached_model = _write(
                cache_root
                / "models--fashn-ai--fashn-vton-1.5"
                / "snapshots"
                / "revision"
                / "model.safetensors"
            )
            bundled_files = {
                filename: _write(assets_root / "dwpose" / filename)
                for filename in DWPOSE_FILENAMES
            }

            result = prepare_weights_dir(
                weights_dir=str(weights_root),
                static_assets_dir=str(assets_root),
                model_cache_root=str(cache_root),
                model_repo_id="fashn-ai/fashn-vton-1.5",
                model_revision="revision",
                dwpose_repo_id="fashn-ai/DWPose",
                dwpose_revision="dwpose-revision",
            )

            self.assertEqual(result, weights_root)
            self.assertEqual(
                (weights_root / "model.safetensors").resolve(),
                cached_model.resolve(),
            )
            for filename, source in bundled_files.items():
                self.assertEqual(
                    (weights_root / "dwpose" / filename).resolve(),
                    source.resolve(),
                )

    def test_missing_cache_fails_fast(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            for filename in DWPOSE_FILENAMES:
                _write(root / "assets" / "dwpose" / filename)

            with self.assertRaisesRegex(FileNotFoundError, "cached model"):
                prepare_weights_dir(
                    weights_dir=str(root / "weights"),
                    static_assets_dir=str(root / "assets"),
                    model_cache_root=str(root / "cache"),
                    model_repo_id="fashn-ai/fashn-vton-1.5",
                    model_revision="revision",
                    dwpose_repo_id="fashn-ai/DWPose",
                    dwpose_revision="dwpose-revision",
                )


if __name__ == "__main__":
    unittest.main()
