"""Stage 3: render arrays to PNG files with matplotlib.

OWNER: visualisation team.

Keep rendering here so the API and any CLI/notebook produce identical images.
Uses the Agg backend so it works on servers with no display.
"""

from __future__ import annotations

from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402
from matplotlib.colors import ListedColormap  # noqa: E402

from app.sar.process import ChangeMap  # noqa: E402

# Colours shared with the frontend legend. Keep in sync with frontend/src/index.css.
COLOR_NO_CHANGE = "#4fd1c5"
COLOR_DECREASE = "#63b3ed"
COLOR_INCREASE = "#f6ad55"

LEGEND = [
    {"color": COLOR_NO_CHANGE, "label": "Little or no change"},
    {"color": COLOR_DECREASE, "label": "Became darker (often flooding or calm water)"},
    {"color": COLOR_INCREASE, "label": "Became brighter (often new structures or rough terrain)"},
]


def _save(fig: plt.Figure, path: Path) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(path, dpi=110, bbox_inches="tight", pad_inches=0, facecolor="black")
    plt.close(fig)
    return path


def render_backscatter(
    db_image: np.ndarray, path: Path, *, vmin: float = -25, vmax: float = 5
) -> Path:
    """Grey-scale backscatter image, the classic SAR look."""
    fig, ax = plt.subplots(figsize=(6.4, 4.8))
    ax.imshow(db_image, cmap="gray", vmin=vmin, vmax=vmax, interpolation="nearest")
    ax.set_axis_off()
    return _save(fig, path)


def render_change(change: ChangeMap, path: Path) -> Path:
    """Three-class change map: no change / decrease / increase."""
    classes = np.zeros(change.log_ratio_db.shape, dtype=np.uint8)
    classes[change.decreased] = 1
    classes[change.increased] = 2
    cmap = ListedColormap([COLOR_NO_CHANGE, COLOR_DECREASE, COLOR_INCREASE])
    fig, ax = plt.subplots(figsize=(6.4, 4.8))
    ax.imshow(classes, cmap=cmap, vmin=0, vmax=2, interpolation="nearest", alpha=0.95)
    ax.set_axis_off()
    return _save(fig, path)
