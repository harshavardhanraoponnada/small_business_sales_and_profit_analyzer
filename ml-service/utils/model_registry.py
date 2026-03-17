import json
import os
from datetime import datetime

REGISTRY_FILE = "registry.json"


def _registry_path(models_dir):
    return os.path.join(models_dir, REGISTRY_FILE)


def load_registry(models_dir):
    path = _registry_path(models_dir)
    if not os.path.exists(path):
        return {"models": {}}
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {"models": {}}


def save_registry(models_dir, registry):
    path = _registry_path(models_dir)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2)


def update_model_entry(models_dir, model_name, payload):
    registry = load_registry(models_dir)
    registry.setdefault("models", {})
    registry["models"][model_name] = {
        **payload,
        "updated_at": datetime.utcnow().isoformat()
    }
    save_registry(models_dir, registry)
    return registry
