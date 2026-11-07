"""Pydantic models for the API contract.

Source of truth: /shared/contracts/analysis.schema.json
TypeScript mirror: /frontend/src/types/analysis.ts

Field names are camelCase on the wire to match the frontend. Keep these three
files in sync and bump CONTRACT_VERSION together.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

CONTRACT_VERSION = "1.0.0"

BBox = tuple[float, float, float, float]


class _Camel(BaseModel):
    """Base that serialises snake_case attributes as camelCase JSON."""

    model_config = ConfigDict(
        alias_generator=lambda s: s.split("_")[0] + "".join(w.title() for w in s.split("_")[1:]),
        populate_by_name=True,
    )


class AreaOfInterest(_Camel):
    name: str | None = None
    bbox: BBox = Field(description="[minLon, minLat, maxLon, maxLat] in WGS84 degrees")

    @field_validator("bbox")
    @classmethod
    def _check_bbox(cls, v: BBox) -> BBox:
        min_lon, min_lat, max_lon, max_lat = v
        if not (-180 <= min_lon < max_lon <= 180):
            raise ValueError("longitudes must satisfy -180 <= minLon < maxLon <= 180")
        if not (-90 <= min_lat < max_lat <= 90):
            raise ValueError("latitudes must satisfy -90 <= minLat < maxLat <= 90")
        return v


class AnalysisRequest(_Camel):
    area: AreaOfInterest
    before_date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    after_date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    source: Literal["sentinel-1"] = "sentinel-1"

    @field_validator("after_date")
    @classmethod
    def _after_is_later(cls, v: str, info):  # noqa: ANN001
        before = info.data.get("before_date")
        if before and v <= before:
            raise ValueError("afterDate must be later than beforeDate")
        return v


class ImageAsset(_Camel):
    url: str
    caption: str
    width_px: int | None = None
    height_px: int | None = None


class LegendEntry(_Camel):
    color: str
    label: str


class ChangeImage(ImageAsset):
    legend: list[LegendEntry]


class Images(_Camel):
    before: ImageAsset
    after: ImageAsset
    change: ChangeImage


class Summary(_Camel):
    headline: str = Field(max_length=120)
    plain: str
    confidence: Literal["low", "medium", "high"]


class Finding(_Camel):
    title: str
    description: str
    severity: Literal["info", "notable", "significant"]
    percent_of_area: float | None = Field(default=None, ge=0, le=100)


class Stats(_Camel):
    analysed_area_km2: float
    changed_area_km2: float
    changed_percent: float
    increase_km2: float
    decrease_km2: float


class Metadata(_Camel):
    satellite: str
    polarization: str
    processing_steps: list[str]
    generated_at: str
    synthetic: bool


class AnalysisResult(_Camel):
    id: str
    contract_version: str = CONTRACT_VERSION
    request: AnalysisRequest
    images: Images
    summary: Summary
    findings: list[Finding]
    stats: Stats
    metadata: Metadata


class ErrorBody(_Camel):
    code: str
    message: str


class ApiError(_Camel):
    error: ErrorBody
