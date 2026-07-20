from __future__ import annotations

import os
from pathlib import Path


MODEL_FILENAME = "model.safetensors"
DWPOSE_FILENAMES = ("yolox_l.onnx", "dw-ll_ucoco_384.onnx")


def _valid_file(path: Path) -> bool:
    try:
        return path.is_file() and path.stat().st_size > 0
    except OSError:
        return False


def _replace_with_symlink(source: Path, destination: Path) -> None:
    source = source.resolve(strict=True)
    destination.parent.mkdir(parents=True, exist_ok=True)

    if destination.is_symlink():
        try:
            if destination.resolve(strict=True) == source:
                return
        except OSError:
            pass
        destination.unlink()
    elif destination.exists():
        if _valid_file(destination):
            return
        destination.unlink()

    os.symlink(source, destination)


def _repo_cache_directory(cache_root: Path, repo_id: str) -> Path:
    return cache_root / f"models--{repo_id.replace('/', '--')}"


def find_cached_model(
    *,
    cache_root: Path,
    repo_id: str,
    revision: str,
    explicit_path: str | None = None,
) -> Path | None:
    if explicit_path:
        candidate = Path(explicit_path)
        if _valid_file(candidate):
            return candidate

    repository_cache = _repo_cache_directory(cache_root, repo_id)
    exact_revision = repository_cache / "snapshots" / revision / MODEL_FILENAME
    if _valid_file(exact_revision):
        return exact_revision

    refs_revision = repository_cache / "refs" / revision
    if _valid_file(refs_revision):
        try:
            snapshot_name = refs_revision.read_text(encoding="utf-8").strip()
        except OSError:
            snapshot_name = ""
        referenced = (
            repository_cache / "snapshots" / snapshot_name / MODEL_FILENAME
        )
        if snapshot_name and _valid_file(referenced):
            return referenced

    snapshots = repository_cache / "snapshots"
    if not snapshots.is_dir():
        return None

    candidates = [
        candidate
        for candidate in snapshots.glob(f"*/{MODEL_FILENAME}")
        if _valid_file(candidate)
    ]
    if not candidates:
        return None
    return max(candidates, key=lambda candidate: candidate.stat().st_mtime_ns)


def prepare_weights_dir(
    *,
    weights_dir: str,
    static_assets_dir: str,
    model_cache_root: str,
    model_repo_id: str,
    model_revision: str,
    dwpose_repo_id: str,
    dwpose_revision: str,
    explicit_cached_model_path: str | None = None,
    allow_download_fallback: bool = False,
) -> Path:
    destination = Path(weights_dir)
    destination.mkdir(parents=True, exist_ok=True)

    model_destination = destination / MODEL_FILENAME
    if not _valid_file(model_destination):
        cached_model = find_cached_model(
            cache_root=Path(model_cache_root),
            repo_id=model_repo_id,
            revision=model_revision,
            explicit_path=explicit_cached_model_path,
        )
        if cached_model is not None:
            _replace_with_symlink(cached_model, model_destination)
        elif allow_download_fallback:
            from huggingface_hub import hf_hub_download

            hf_hub_download(
                repo_id=model_repo_id,
                filename=MODEL_FILENAME,
                revision=model_revision,
                local_dir=destination,
            )
        else:
            raise FileNotFoundError(
                "RunPod cached model was not found. Configure the endpoint Model "
                f"field as {model_repo_id}."
            )

    static_dwpose_dir = Path(static_assets_dir) / "dwpose"
    destination_dwpose_dir = destination / "dwpose"
    destination_dwpose_dir.mkdir(parents=True, exist_ok=True)
    for filename in DWPOSE_FILENAMES:
        target = destination_dwpose_dir / filename
        if _valid_file(target):
            continue

        bundled = static_dwpose_dir / filename
        if _valid_file(bundled):
            _replace_with_symlink(bundled, target)
            continue

        if allow_download_fallback:
            from huggingface_hub import hf_hub_download

            hf_hub_download(
                repo_id=dwpose_repo_id,
                filename=filename,
                revision=dwpose_revision,
                local_dir=destination_dwpose_dir,
            )
            continue

        raise FileNotFoundError(
            f"Bundled DWPose asset is missing: {bundled}"
        )

    required = (
        model_destination,
        *(destination_dwpose_dir / filename for filename in DWPOSE_FILENAMES),
    )
    missing = [str(path) for path in required if not _valid_file(path)]
    if missing:
        raise FileNotFoundError("Missing VTON weights: " + ", ".join(missing))
    return destination
