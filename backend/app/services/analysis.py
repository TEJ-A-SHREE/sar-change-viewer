"""Orchestrates the four SAR stages into one AnalysisResult.

This is the only place that knows about all stages. Teams change their own
stage; this file only changes when the contract between stages changes.
"""

from __future__ import annotations

import hashlib
from datetime import UTC, datetime

from app import config
from app.models import (
    AnalysisRequest,
    AnalysisResult,
    ChangeImage,
    ImageAsset,
    Images,
    LegendEntry,
    Metadata,
)
from app.sar import analyze, fetch, process, visualize


def _request_id(request: AnalysisRequest) -> str:
    raw = request.model_dump_json(by_alias=True)
    return hashlib.sha1(raw.encode()).hexdigest()[:12]


def run_analysis(request: AnalysisRequest) -> AnalysisResult:
    synthetic = config.DATA_MODE != "live"
    bbox = request.area.bbox

    # 1. Fetch
    if synthetic:
        before = fetch.synthetic_scene(bbox, request.before_date, seed=1)
        after = fetch.synthetic_scene(bbox, request.after_date, flooded=True, seed=2)
    else:
        before = fetch.fetch_scene(bbox, request.before_date, request.source)
        after = fetch.fetch_scene(bbox, request.after_date, request.source)

    # 2. Process
    change = process.compute_change(
        before.intensity, after.intensity, threshold_db=config.CHANGE_THRESHOLD_DB
    )

    # 3. Visualise
    rid = _request_id(request)
    out = config.OUTPUT_DIR / rid
    visualize.render_backscatter(change.before_db, out / "before.png")
    visualize.render_backscatter(change.after_db, out / "after.png")
    visualize.render_change(change, out / "change.png")

    # 4. Explain
    explanation = analyze.explain(change, before.pixel_size_m, request.area.name)

    where = request.area.name or "the selected area"
    return AnalysisResult(
        id=rid,
        request=request,
        images=Images(
            before=ImageAsset(
                url=f"/outputs/{rid}/before.png",
                caption=(
                    f"Radar view of {where} on {request.before_date}. Brighter areas bounce "
                    "more radar back (buildings, rough ground); dark areas are smooth, like water."
                ),
            ),
            after=ImageAsset(
                url=f"/outputs/{rid}/after.png",
                caption=f"Radar view of {where} on {request.after_date}, same scale as before.",
            ),
            change=ChangeImage(
                url=f"/outputs/{rid}/change.png",
                caption=(
                    "Where the two dates differ. Teal is little change; blue became darker; "
                    "orange became brighter."
                ),
                legend=[LegendEntry(**entry) for entry in visualize.LEGEND],
            ),
        ),
        summary=explanation.summary,
        findings=explanation.findings,
        stats=explanation.stats,
        metadata=Metadata(
            satellite=before.satellite + (" (synthetic)" if synthetic else ""),
            polarization=before.polarization,
            processing_steps=[
                "Fetched one scene per date covering the area",
                "Converted radar intensity to decibels",
                "Reduced speckle noise with a 5x5 Lee filter",
                "Computed the difference between dates (log-ratio)",
                f"Flagged pixels beyond ±{config.CHANGE_THRESHOLD_DB:g} dB as changed",
            ],
            generated_at=datetime.now(UTC).isoformat(),
            synthetic=synthetic,
        ),
    )
