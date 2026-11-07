"""Stage 4: explain a change map in plain language.

OWNER: analysis team.

Input is numbers; output is text a non-technical person can read. Rules of thumb:
  * Headline under 12 words, one concrete fact.
  * No acronyms without explanation (say "radar", not "SAR backscatter").
  * Always say what the pattern *usually* means, not what it *is*.
"""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

from app.models import Finding, Stats, Summary
from app.sar.process import ChangeMap


@dataclass
class Explanation:
    summary: Summary
    findings: list[Finding]
    stats: Stats


def _quadrant_name(mask: np.ndarray) -> str:
    """Rough location of the changed pixels, e.g. 'south-east'."""
    if not mask.any():
        return "the area"
    ys, xs = np.nonzero(mask)
    rows, cols = mask.shape
    ns = "north" if ys.mean() < rows / 2 else "south"
    ew = "west" if xs.mean() < cols / 2 else "east"
    return f"the {ns}-{ew}"


def explain(change: ChangeMap, pixel_size_m: float, area_name: str | None) -> Explanation:
    px_km2 = (pixel_size_m / 1000.0) ** 2
    total = change.changed.size
    n_changed = int(change.changed.sum())
    n_inc = int(change.increased.sum())
    n_dec = int(change.decreased.sum())

    stats = Stats(
        analysed_area_km2=round(total * px_km2, 1),
        changed_area_km2=round(n_changed * px_km2, 1),
        changed_percent=round(100.0 * n_changed / total, 1),
        increase_km2=round(n_inc * px_km2, 1),
        decrease_km2=round(n_dec * px_km2, 1),
    )

    where = area_name or "the selected area"
    findings: list[Finding] = []

    dec_pct = 100.0 * n_dec / total
    inc_pct = 100.0 * n_inc / total

    if dec_pct >= 1:
        findings.append(
            Finding(
                title=f"Surface became much darker in {_quadrant_name(change.decreased)}",
                description=(
                    f"About {stats.decrease_km2:g} km² reflects far less radar than before. "
                    "This usually means standing water appeared (flooding, a filled reservoir) "
                    "or vegetation was cleared to bare smooth ground."
                ),
                severity="significant" if dec_pct >= 5 else "notable",
                percent_of_area=round(dec_pct, 1),
            )
        )
    if inc_pct >= 1:
        findings.append(
            Finding(
                title=f"Surface became brighter in {_quadrant_name(change.increased)}",
                description=(
                    f"About {stats.increase_km2:g} km² reflects more radar than before. "
                    "This often means new buildings, construction, or water that drained away."
                ),
                severity="significant" if inc_pct >= 5 else "notable",
                percent_of_area=round(inc_pct, 1),
            )
        )
    unchanged_pct = 100.0 - stats.changed_percent
    findings.append(
        Finding(
            title="Most of the area did not change",
            description=f"About {unchanged_pct:.0f}% of {where} looks the same on both dates.",
            severity="info",
            percent_of_area=round(unchanged_pct, 1),
        )
    )

    if stats.changed_percent < 1:
        headline = "Almost nothing changed between the two dates"
        plain = (
            f"The radar images of {where} look nearly identical on both dates. "
            "Any differences are within the normal noise of radar imagery."
        )
        confidence = "high"
    elif dec_pct >= inc_pct:
        headline = f"About {stats.changed_percent:.0f}% of the area became darker to radar"
        plain = (
            f"Between the two dates, part of {where} went from a rough, bright surface to a "
            "smooth, dark one. On radar that pattern usually means water appeared or land was "
            f"cleared. Roughly {stats.decrease_km2:g} km² is affected, mostly in "
            f"{_quadrant_name(change.decreased)}. The rest of the area stayed about the same."
        )
        confidence = "medium"
    else:
        headline = f"About {stats.changed_percent:.0f}% of the area became brighter to radar"
        plain = (
            f"Between the two dates, part of {where} reflects noticeably more radar signal. "
            "That usually points to new construction, rougher ground, or water draining away. "
            f"Roughly {stats.increase_km2:g} km² is affected, mostly in "
            f"{_quadrant_name(change.increased)}."
        )
        confidence = "medium"

    return Explanation(
        summary=Summary(headline=headline, plain=plain, confidence=confidence),
        findings=findings,
        stats=stats,
    )
