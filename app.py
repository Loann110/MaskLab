from __future__ import annotations

# ------------------ #
# IMPORTS ---------- #
# ------------------ #

import json
import os
import threading
import time
import webbrowser
from pathlib import Path
from typing import Any
from urllib.parse import quote

import torch
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from PIL import Image

from core.file_utils import list_images, resolve_path, safe_file_response_path
from core.mask_utils import (
    combine_instance_masks,
    save_binary_mask,
    save_instance_masks,
    save_meta_json,
    save_overlay,
    to_bool_masks,
)
from core.sam3_local import Sam3LocalRuntime


# ------------------ #
# PATHS ------------ #
# ------------------ #

PROJECT_ROOT = Path(__file__).resolve().parent
WEB_DIR = PROJECT_ROOT / "web"
DEFAULT_CONFIG_PATH = PROJECT_ROOT / "config.json"


# ------------------ #
# APP -------------- #
# ------------------ #

runtime = Sam3LocalRuntime(PROJECT_ROOT)
stop_event = threading.Event()

app = FastAPI(title="Local SAM3 Mask Creator", version="1.0.0")


# ------------------ #
# DATA ------------- #
# ------------------ #

class ConfigUpdate(BaseModel):
    images_dir: str = ""
    masks_dir: str = ""
    checkpoint_path: str = ""
    sam3_repo_path: str = ""
    bpe_path: str = ""
    language: str = "fr"
    prompt: str = "mask"
    confidence_threshold: float = Field(0.35, ge=0.0, le=1.0)
    save_meta_json: bool = False
    save_instance_masks: bool = True
    open_browser_on_start: bool = True
    host: str = "127.0.0.1"
    port: int = 7860


class ProcessRequest(BaseModel):
    image_path: str | None = None
    images_dir: str = ""
    masks_dir: str = ""
    checkpoint_path: str = ""
    sam3_repo_path: str = ""
    bpe_path: str = ""
    prompt: str = "mask"
    confidence_threshold: float = Field(0.35, ge=0.0, le=1.0)
    save_meta_json: bool = False
    save_instance_masks: bool = True


# ------------------ #
# CONFIG ----------- #
# ------------------ #

def get_config_path() -> Path:
    config_dir = os.environ.get("SAM3_CONFIG_DIR", "").strip()

    if config_dir:
        try:
            path = Path(config_dir)
            path.mkdir(parents=True, exist_ok=True)
            return path / "config.json"
        except OSError:
            pass

    return DEFAULT_CONFIG_PATH


CONFIG_PATH = get_config_path()


def load_config() -> dict[str, Any]:
    if CONFIG_PATH.exists():
        return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))

    if DEFAULT_CONFIG_PATH.exists() and DEFAULT_CONFIG_PATH != CONFIG_PATH:
        return json.loads(DEFAULT_CONFIG_PATH.read_text(encoding="utf-8"))

    return {}


def save_config(config: dict[str, Any]) -> None:
    CONFIG_PATH.write_text(
        json.dumps(config, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


# ------------------ #
# UTILS ------------ #
# ------------------ #

def file_url(path: Path | None) -> str | None:
    if path is None:
        return None

    return f"/api/file?path={quote(str(path), safe='')}"


def check_stop() -> None:
    if stop_event.is_set():
        raise RuntimeError("Génération arrêtée par l'utilisateur.")


def http_error(error: Exception, code: int = 500) -> None:
    raise HTTPException(status_code=code, detail=str(error)) from error


# ------------------ #
# PROCESS ---------- #
# ------------------ #

def scan_images_dir(images_dir_str: str) -> list[dict[str, Any]]:
    images_dir = resolve_path(images_dir_str, PROJECT_ROOT)

    if not images_dir.exists():
        raise FileNotFoundError(f"Dossier images introuvable: {images_dir}")

    return [
        {
            "name": path.name,
            "stem": path.stem,
            "path": str(path),
            "url": file_url(path),
        }
        for path in list_images(images_dir)
    ]


def process_image(req: ProcessRequest, image_path: Path) -> dict[str, Any]:
    check_stop()

    masks_dir = resolve_path(req.masks_dir, PROJECT_ROOT)
    masks_dir.mkdir(parents=True, exist_ok=True)

    _, processor, model_info = runtime.load(
        sam3_repo_path=req.sam3_repo_path,
        checkpoint_path=req.checkpoint_path,
        confidence_threshold=req.confidence_threshold,
        bpe_path=req.bpe_path,
        extra_search_paths=[req.images_dir, req.masks_dir],
    )

    check_stop()

    with Image.open(image_path) as img:
        image = img.convert("RGB")

    width, height = image.size

    with torch.inference_mode():
        check_stop()
        state = processor.set_image(image)

        check_stop()
        output = processor.set_text_prompt(state=state, prompt=req.prompt)

        check_stop()

    masks = output.get("masks")
    boxes = output.get("boxes")
    scores = output.get("scores")

    if masks is None:
        masks_nhw = torch.zeros((0, height, width), dtype=torch.bool)
        combined = torch.zeros((height, width), dtype=torch.bool)
        num_instances = 0
    else:
        masks_nhw = to_bool_masks(masks)
        combined = combine_instance_masks(masks_nhw)
        num_instances = int(masks_nhw.shape[0])

        if combined is None:
            combined = torch.zeros((height, width), dtype=torch.bool)

    combined_path = masks_dir / f"{image_path.stem}.png"
    overlay_path = masks_dir / "_overlay" / f"{image_path.stem}_overlay.png"

    save_binary_mask(combined, combined_path, size_wh=(width, height))
    save_overlay(image, combined, overlay_path, size_wh=(width, height))

    instance_paths = []

    if req.save_instance_masks and num_instances > 0:
        instance_paths = save_instance_masks(
            masks_nhw,
            masks_dir,
            image_path.stem,
            size_wh=(width, height),
        )

    meta_path = None

    if req.save_meta_json:
        meta_path = masks_dir / f"{image_path.stem}.json"

        meta = {
            "image": str(image_path),
            "prompt": req.prompt,
            "confidence_threshold": req.confidence_threshold,
            "num_instances": num_instances,
            "boxes": None if boxes is None else torch.as_tensor(boxes).detach().cpu().tolist(),
            "scores": None if scores is None else torch.as_tensor(scores).detach().cpu().tolist(),
            "combined_mask": str(combined_path),
            "overlay": str(overlay_path),
            "instances": [str(path) for path in instance_paths],
            "model": model_info,
        }

        save_meta_json(meta_path, meta)

    return {
        "image": {
            "name": image_path.name,
            "path": str(image_path),
            "url": file_url(image_path),
            "width": width,
            "height": height,
        },
        "prompt": req.prompt,
        "confidence_threshold": req.confidence_threshold,
        "num_instances": num_instances,
        "combined_mask": {
            "path": str(combined_path),
            "url": file_url(combined_path),
        },
        "overlay": {
            "path": str(overlay_path),
            "url": file_url(overlay_path),
        },
        "instances": [
            {
                "name": path.name,
                "path": str(path),
                "url": file_url(path),
            }
            for path in instance_paths
        ],
        "meta_json": None if meta_path is None else {
            "path": str(meta_path),
            "url": file_url(meta_path),
        },
        "model": model_info,
    }


# ------------------ #
# API CONFIG ------- #
# ------------------ #

@app.get("/api/config")
def api_get_config():
    return load_config()


@app.post("/api/config")
def api_save_config(cfg: ConfigUpdate):
    data = cfg.model_dump()

    data.pop("images_dir", None)
    data.pop("masks_dir", None)

    config = load_config()
    config.update(data)
    save_config(config)

    return {"ok": True, "config": config}


# ------------------ #
# API MODEL -------- #
# ------------------ #

@app.get("/api/status")
def api_status():
    return {
        "model_loaded": runtime.model is not None,
        "device": runtime.device,
        "cache_key": runtime.cache_key,
    }


@app.post("/api/load-model")
def api_load_model(req: ProcessRequest):
    try:
        _, _, info = runtime.load(
            sam3_repo_path=req.sam3_repo_path,
            checkpoint_path=req.checkpoint_path,
            confidence_threshold=req.confidence_threshold,
            bpe_path=req.bpe_path,
            extra_search_paths=[req.images_dir, req.masks_dir],
        )

        return {"ok": True, "model": info}

    except Exception as error:
        http_error(error)


# ------------------ #
# API SCAN --------- #
# ------------------ #

@app.post("/api/scan")
def api_scan(req: ProcessRequest):
    try:
        images = scan_images_dir(req.images_dir)
        return {"count": len(images), "images": images}

    except Exception as error:
        http_error(error, 400)


# ------------------ #
# API PROCESS ------ #
# ------------------ #

@app.post("/api/process-one")
def api_process_one(req: ProcessRequest):
    stop_event.clear()

    if not req.image_path:
        raise HTTPException(status_code=400, detail="Aucune image sélectionnée.")

    try:
        image_path = Path(req.image_path).expanduser().resolve()

        if not image_path.exists():
            raise FileNotFoundError(f"Image introuvable: {image_path}")

        return process_image(req, image_path)

    except RuntimeError as error:
        if "arrêtée" in str(error):
            http_error(error, 409)

        http_error(error)

    except Exception as error:
        http_error(error)


@app.post("/api/process-all")
def api_process_all(req: ProcessRequest):
    stop_event.clear()

    try:
        images_dir = resolve_path(req.images_dir, PROJECT_ROOT)
        image_paths = list(list_images(images_dir))

        results = []
        errors = []

        for index, image_path in enumerate(image_paths, start=1):
            if stop_event.is_set():
                break

            try:
                result = process_image(req, image_path)
                result["index"] = index
                result["total"] = len(image_paths)
                results.append(result)

            except Exception as error:
                errors.append({
                    "image": str(image_path),
                    "error": str(error),
                })

        return {
            "count": len(results),
            "errors": errors,
            "results": results,
            "stopped": stop_event.is_set(),
        }

    except Exception as error:
        http_error(error)


@app.post("/api/process-all-stream")
def api_process_all_stream(req: ProcessRequest):
    stop_event.clear()

    images_dir = resolve_path(req.images_dir, PROJECT_ROOT)
    image_paths = list(list_images(images_dir))
    total = len(image_paths)

    def generate():
        done = 0
        errors = 0

        yield json.dumps({"event": "start", "total": total}) + "\n"

        for index, image_path in enumerate(image_paths, start=1):
            if stop_event.is_set():
                break

            try:
                result = process_image(req, image_path)
                result["index"] = index
                result["total"] = total

                done += 1

                yield json.dumps({
                    "event": "item",
                    "index": index,
                    "total": total,
                    "ok": True,
                    "result": result,
                }) + "\n"

            except RuntimeError as error:
                if "arrêtée" in str(error):
                    stop_event.set()
                    break

                errors += 1

                yield json.dumps({
                    "event": "item",
                    "index": index,
                    "total": total,
                    "ok": False,
                    "image": str(image_path),
                    "error": str(error),
                }) + "\n"

            except Exception as error:
                errors += 1

                yield json.dumps({
                    "event": "item",
                    "index": index,
                    "total": total,
                    "ok": False,
                    "image": str(image_path),
                    "error": str(error),
                }) + "\n"

        event = "stopped" if stop_event.is_set() else "done"

        yield json.dumps({
            "event": event,
            "total": total,
            "done": done,
            "errors": errors,
        }) + "\n"

    return StreamingResponse(
        generate(),
        media_type="application/x-ndjson",
    )


# ------------------ #
# API STOP --------- #
# ------------------ #

@app.post("/api/stop")
def api_stop():
    stop_event.set()
    return {"ok": True, "message": "Arrêt demandé."}


# ------------------ #
# API FILE --------- #
# ------------------ #

@app.get("/api/file")
def api_file(path: str = Query(...), download: int = 0):
    try:
        file_path = safe_file_response_path(path)

        if download:
            return FileResponse(file_path, filename=file_path.name)

        return FileResponse(file_path)

    except Exception as error:
        http_error(error, 404)


# ------------------ #
# WEB APP ---------- #
# ------------------ #

app.mount("/", StaticFiles(directory=WEB_DIR, html=True), name="web")


# ------------------ #
# START ------------ #
# ------------------ #

def open_browser_later(url: str) -> None:
    time.sleep(1.0)
    webbrowser.open(url)


if __name__ == "__main__":
    import uvicorn

    config = load_config()

    host = config.get("host", "127.0.0.1")
    port = int(config.get("port", 7860))
    url = f"http://{host}:{port}"

    in_electron = os.environ.get("ELECTRON_RUN", "") == "1"

    if config.get("open_browser_on_start", True) and not in_electron:
        thread = threading.Thread(
            target=open_browser_later,
            args=(url,),
            daemon=True,
        )
        thread.start()

    print("\nLocal SAM3 Mask Creator")
    print(f"Interface: {url}")

    if in_electron:
        print("SAM3_BACKEND_READY", flush=True)

    print("Press CTRL+C to stop.\n", flush=True)

    uvicorn.run(app, host=host, port=port)
