"""Runtime settings. Everything is overridable with environment variables."""

from __future__ import annotations

import os
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parent.parent

# Where rendered PNGs are written. Served at /outputs/<file>.
OUTPUT_DIR = Path(os.environ.get("SAR_OUTPUT_DIR", BACKEND_ROOT / "outputs"))

# Where downloaded scenes are cached. Ignored by git.
DATA_DIR = Path(os.environ.get("SAR_DATA_DIR", BACKEND_ROOT / "data"))

# "synthetic" generates fake scenes so the whole pipeline runs with no downloads.
# "live" calls app.sar.fetch (to be implemented by the data team).
DATA_MODE = os.environ.get("SAR_DATA_MODE", "synthetic")

# Threshold in dB for calling a pixel "changed".
CHANGE_THRESHOLD_DB = float(os.environ.get("SAR_CHANGE_THRESHOLD_DB", "3.0"))

# Comma-separated list of origins allowed to call the API (for production).
CORS_ORIGINS = [
    o for o in os.environ.get("SAR_CORS_ORIGINS", "http://localhost:5173").split(",") if o
]
