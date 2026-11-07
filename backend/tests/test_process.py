import numpy as np

from app.sar.fetch import synthetic_scene
from app.sar.process import compute_change, to_db


def test_to_db_handles_zero():
    assert np.isfinite(to_db(np.zeros(3))).all()


def test_flooded_scene_is_detected_as_decrease():
    bbox = (0.0, 0.0, 1.0, 1.0)
    before = synthetic_scene(bbox, "2024-01-01", seed=1)
    after = synthetic_scene(bbox, "2024-02-01", flooded=True, seed=2)
    change = compute_change(before.intensity, after.intensity)
    decreased_pct = change.decreased.mean() * 100
    assert decreased_pct > 5
    assert change.increased.mean() < change.decreased.mean()


def test_identical_scenes_show_no_change():
    bbox = (0.0, 0.0, 1.0, 1.0)
    s = synthetic_scene(bbox, "2024-01-01", seed=3)
    change = compute_change(s.intensity, s.intensity)
    assert not change.changed.any()
