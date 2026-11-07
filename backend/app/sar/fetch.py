"""Stage 1: fetch SAR scenes.

OWNER: data team.

Contract
--------
`fetch_scene(bbox, date, source)` must return a `Scene`: a 2-D float32 numpy
array of linear backscatter intensity (not dB) for the requested bounding box,
plus the pixel size in metres. Rows are north-to-south, columns west-to-east.

Suggested real implementation (not done yet):
  * Search ASF (https://search.asf.alaska.edu) or Copernicus Data Space for a
    Sentinel-1 GRD scene nearest to `date` that covers `bbox`.
  * Download it to `app.config.DATA_DIR` (cache by scene id).
  * Read the VV band with rasterio, clip to `bbox`, and return the array.

Until then, `synthetic_scene()` fabricates something plausible so the rest of
the pipeline can run.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from app.models import BBox


@dataclass
class Scene:
    intensity: np.ndarray  # linear power, float32, shape (rows, cols)
    pixel_size_m: float
    bbox: BBox
    date: str
    satellite: str = "Sentinel-1"
    polarization: str = "VV"


def fetch_scene(bbox: BBox, date: str, source: str = "sentinel-1") -> Scene:
    """Fetch a real scene. Not implemented yet; see module docstring."""
    raise NotImplementedError(
        "Live SAR fetching is not wired up yet. Set SAR_DATA_MODE=synthetic or implement "
        "app.sar.fetch.fetch_scene()."
    )


def synthetic_scene(bbox: BBox, date: str, *, flooded: bool = False, seed: int = 0) -> Scene:
    """Fabricate a speckled scene. If `flooded`, darken a blob in the south-east."""
    rng = np.random.default_rng(seed)
    rows, cols = 240, 320
    # Smooth "terrain" background between 0.05 and 0.4 linear power.
    yy, xx = np.mgrid[0:rows, 0:cols]
    base = 0.2 + 0.15 * np.sin(xx / 37.0) * np.cos(yy / 29.0) + 0.05
    # A bright "town" strip.
    base[rows // 3 : rows // 3 + 6, :] += 0.6
    if flooded:
        mask = (xx > cols * 0.55) & (yy > rows * 0.45)
        blob = mask & (rng.random((rows, cols)) > 0.15)
        base[blob] = 0.01  # calm water is nearly black to radar
    # Multiplicative speckle (gamma with mean 1) like real single-look SAR.
    speckle = rng.gamma(shape=4.0, scale=0.25, size=(rows, cols))
    intensity = (base * speckle).astype(np.float32)
    return Scene(intensity=intensity, pixel_size_m=100.0, bbox=bbox, date=date)
