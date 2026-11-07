"""Stage 2: turn two scenes into a change map.

OWNER: processing team.

All functions are pure numpy/scipy so they are easy to unit-test.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from scipy.ndimage import uniform_filter


def to_db(intensity: np.ndarray) -> np.ndarray:
    """Linear power -> decibels. Clamps to avoid log(0)."""
    return 10.0 * np.log10(np.clip(intensity, 1e-6, None))


def lee_filter(img: np.ndarray, size: int = 5) -> np.ndarray:
    """Classic Lee speckle filter. Works on linear or dB images."""
    mean = uniform_filter(img, size)
    sq_mean = uniform_filter(img * img, size)
    var = np.clip(sq_mean - mean * mean, 0, None)
    overall_var = img.var()
    weight = var / (var + overall_var + 1e-12)
    return mean + weight * (img - mean)


@dataclass
class ChangeMap:
    before_db: np.ndarray
    after_db: np.ndarray
    log_ratio_db: np.ndarray  # after - before, in dB
    changed: np.ndarray  # bool mask
    increased: np.ndarray  # bool: became brighter
    decreased: np.ndarray  # bool: became darker
    threshold_db: float


def compute_change(
    before: np.ndarray, after: np.ndarray, *, threshold_db: float = 3.0, filter_size: int = 5
) -> ChangeMap:
    """Standard log-ratio change detection with speckle filtering."""
    if before.shape != after.shape:
        raise ValueError(f"scene shapes differ: {before.shape} vs {after.shape}")
    before_db = lee_filter(to_db(before), filter_size)
    after_db = lee_filter(to_db(after), filter_size)
    log_ratio = after_db - before_db
    increased = log_ratio > threshold_db
    decreased = log_ratio < -threshold_db
    return ChangeMap(
        before_db=before_db,
        after_db=after_db,
        log_ratio_db=log_ratio,
        changed=increased | decreased,
        increased=increased,
        decreased=decreased,
        threshold_db=threshold_db,
    )
