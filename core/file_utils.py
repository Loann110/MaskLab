from __future__ import annotations

from pathlib import Path
from typing import Iterable

IMG_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp"}


def resolve_path(path_str: str | None, base: Path) -> Path:
    """Return an absolute path. Empty path -> base."""
    if not path_str:
        return base.resolve()
    p = Path(path_str).expanduser()
    return p if p.is_absolute() else (base / p).resolve()


def list_images(images_dir: Path) -> Iterable[Path]:
    images_dir = images_dir.expanduser().resolve()
    if not images_dir.is_dir():
        return []
    return sorted(
        p for p in images_dir.rglob("*")
        if p.is_file() and p.suffix.lower() in IMG_EXTS
    )


def safe_file_response_path(path_str: str) -> Path:
    p = Path(path_str).expanduser().resolve()
    if not p.is_file():
        raise FileNotFoundError(f"Fichier introuvable: {p}")
    return p
