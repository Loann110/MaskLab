from __future__ import annotations

# ------------------ #
# IMPORTS ---------- #
# ------------------ #

import importlib
import inspect
import os
import sys
from pathlib import Path
from typing import Any

import torch


# ------------------ #
# PATHS ------------ #
# ------------------ #

CORE_DIR = Path(__file__).resolve().parent
MASKLAB_DIR = CORE_DIR.parent

SAM3_PACKAGE_PATH = MASKLAB_DIR / "sam3"
BPE_PATH = SAM3_PACKAGE_PATH / "assets" / "bpe_simple_vocab_16e6.txt.gz"


# ------------------ #
# OFFLINE MODE ----- #
# ------------------ #

# Keep Hugging Face libraries offline if used.
os.environ.setdefault("HF_HUB_OFFLINE", "1")
os.environ.setdefault("TRANSFORMERS_OFFLINE", "1")
os.environ.setdefault("HF_DATASETS_OFFLINE", "1")
os.environ.setdefault("HF_HUB_DISABLE_TELEMETRY", "1")


# ------------------ #
# UTILS ------------ #
# ------------------ #

def resolve_path(path_str: str | None, base: Path) -> Path:
    if not path_str:
        raise FileNotFoundError("Chemin non renseigné.")

    path = Path(path_str).expanduser()

    if not path.is_absolute():
        path = base / path

    return path.resolve()


def check_file(path: Path, name: str) -> None:
    if not path.exists() or not path.is_file():
        raise FileNotFoundError(f"{name} introuvable: {path}")


def check_dir(path: Path, name: str) -> None:
    if not path.exists() or not path.is_dir():
        raise FileNotFoundError(f"{name} introuvable: {path}")


def add_to_sys_path(path: Path) -> None:
    path_str = str(path)

    if path_str in sys.path:
        sys.path.remove(path_str)

    sys.path.insert(0, path_str)


def clear_sam3_modules() -> None:
    for module_name in list(sys.modules):
        if module_name == "sam3" or module_name.startswith("sam3."):
            del sys.modules[module_name]


def call_builder(builder: Any, kwargs: dict[str, Any]) -> Any:
    try:
        signature = inspect.signature(builder)
        parameters = signature.parameters

        accepts_all_kwargs = False

        for parameter in parameters.values():
            if parameter.kind == inspect.Parameter.VAR_KEYWORD:
                accepts_all_kwargs = True

        if not accepts_all_kwargs:
            filtered_kwargs = {}

            for key, value in kwargs.items():
                if key in parameters:
                    filtered_kwargs[key] = value

            kwargs = filtered_kwargs

    except Exception:
        pass

    return builder(**kwargs)


# ------------------ #
# SAM3 RUNTIME ----- #
# ------------------ #

class Sam3LocalRuntime:
    def __init__(self, project_root: Path):
        self.project_root = project_root.resolve()
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        self.model = None
        self.processor_cls = None
        self.cache_key = None

    def load(
        self,
        sam3_repo_path: str | None,
        checkpoint_path: str,
        confidence_threshold: float,
        bpe_path: str | None = None,
        extra_search_paths: list[str] | None = None,
    ):
        # These arguments are kept to avoid breaking old code.
        _ = sam3_repo_path
        _ = bpe_path
        _ = extra_search_paths

        sam3_path = SAM3_PACKAGE_PATH.resolve()
        bpe_file = BPE_PATH.resolve()
        checkpoint_file = resolve_path(checkpoint_path, self.project_root)

        check_dir(sam3_path, "Dossier SAM3")
        check_file(bpe_file, "Fichier BPE")
        check_file(checkpoint_file, "Checkpoint SAM3")

        model_builder_file = sam3_path / "model_builder.py"

        if not model_builder_file.exists():
            raise FileNotFoundError(
                "Impossible de trouver model_builder.py.\n"
                f"Chemin attendu: {model_builder_file}"
            )

        # To import sam3.model_builder,
        # Python needs the parent folder of sam3 in sys.path.
        import_root = sam3_path.parent

        add_to_sys_path(import_root)

        new_cache_key = (
            str(import_root),
            str(checkpoint_file),
            str(bpe_file),
            self.device,
        )

        if self.model is None or self.cache_key != new_cache_key:
            clear_sam3_modules()

            try:
                build_mod = importlib.import_module("sam3.model_builder")
                proc_mod = importlib.import_module("sam3.model.sam3_image_processor")

            except Exception as error:
                raise ImportError(
                    "Impossible d'importer SAM3 depuis le repo local.\n"
                    f"Import root utilisé: {import_root}\n"
                    f"Dossier SAM3 utilisé: {sam3_path}\n"
                    f"Erreur Python: {error}"
                ) from error

            build_sam3_image_model = build_mod.build_sam3_image_model
            self.processor_cls = proc_mod.Sam3Processor

            builder_kwargs = {
                "bpe_path": str(bpe_file),
                "checkpoint_path": str(checkpoint_file),
                "device": self.device,
                "eval_mode": True,
                "load_from_HF": False,
                "enable_segmentation": True,
                "enable_inst_interactivity": False,
                "compile": False,
            }

            self.model = call_builder(
                build_sam3_image_model,
                builder_kwargs
            )

            self.model = self.model.to(self.device)
            self.model = self.model.eval()

            self.cache_key = new_cache_key

        processor = self.processor_cls(
            self.model,
            confidence_threshold=float(confidence_threshold)
        )

        infos = {
            "device": self.device,
            "sam3_import_root": str(import_root),
            "sam3_package_path": str(sam3_path),
            "checkpoint_path": str(checkpoint_file),
            "bpe_path": str(bpe_file),
            "loaded": True,
        }

        return self.model, processor, infos