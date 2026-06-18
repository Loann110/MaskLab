from __future__ import annotations

import json
from pathlib import Path
from typing import Optional

import numpy as np
import torch
from PIL import Image


def to_bool_masks(masks: torch.Tensor) -> torch.Tensor:
    """Convert SAM masks to a boolean tensor shaped [N, H, W]."""
    masks = torch.as_tensor(masks)

    if masks.numel() == 0:
        return torch.empty((0, 0, 0), dtype=torch.bool)

    if masks.ndim == 4:      # [N, 1, H, W] -> [N, H, W]
        masks = masks[:, 0]
    elif masks.ndim == 2:    # [H, W] -> [1, H, W]
        masks = masks[None]

    return masks if masks.dtype == torch.bool else masks > 0.5


def combine_instance_masks(masks_nhw: torch.Tensor) -> Optional[torch.Tensor]:
    if masks_nhw.numel() == 0 or masks_nhw.shape[0] == 0:
        return None
    return masks_nhw.any(dim=0)


def _mask_image(mask_hw: torch.Tensor, size_wh: tuple[int, int]) -> Image.Image:
    arr = mask_hw.detach().cpu().numpy().astype(np.uint8) * 255
    img = Image.fromarray(arr, mode="L")
    return img if img.size == size_wh else img.resize(size_wh, Image.NEAREST)


def save_binary_mask(mask_hw: torch.Tensor, out_path: Path, size_wh: tuple[int, int]) -> Path:
    out_path.parent.mkdir(parents=True, exist_ok=True)
    _mask_image(mask_hw, size_wh).save(out_path)
    return out_path


def save_instance_masks(masks_nhw: torch.Tensor, out_root: Path, stem: str, size_wh: tuple[int, int]) -> list[Path]:
    inst_dir = out_root / "_instances" / stem
    return [save_binary_mask(mask, inst_dir / f"mask_{i:03d}.png", size_wh) for i, mask in enumerate(masks_nhw)]


def save_overlay(image_rgb: Image.Image, mask_hw: torch.Tensor, out_path: Path, size_wh: tuple[int, int]) -> Path:
    base = image_rgb.convert("RGBA")
    mask = _mask_image(mask_hw, size_wh)

    red = Image.new("RGBA", base.size, (255, 40, 40, 115))
    transparent = Image.new("RGBA", base.size, (0, 0, 0, 0))
    overlay = Image.alpha_composite(base, Image.composite(red, transparent, mask))

    out_path.parent.mkdir(parents=True, exist_ok=True)
    overlay.save(out_path)
    return out_path


def save_meta_json(meta_path: Path, meta: dict) -> Path:
    meta_path.parent.mkdir(parents=True, exist_ok=True)
    meta_path.write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")
    return meta_path
