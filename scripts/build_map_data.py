#!/usr/bin/env python3
"""Build the slim GeoJSON files the explore map uses.

Reads Natural Earth GeoJSON (public domain) and writes:
  frontend/public/data/world.json          countries with name / iso3 / continent
  frontend/public/data/states/<ISO3>.json  admin-1 regions for countries we care about

Usage:
  python3 -I scripts/build_map_data.py <ne_110m_admin_0_countries.geojson> \
      <ne_50m_admin_1_states_provinces.geojson> [--states IND,USA]

Sources (download once, do not commit):
  https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson
  https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson

Only the standard library is used so anyone can run it.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "frontend" / "public" / "data"

SKIP_CONTINENTS = {"Seven seas (open ocean)", "Antarctica"}


def rounded(coords, nd: int):
    if isinstance(coords[0], (int, float)):
        return [round(coords[0], nd), round(coords[1], nd)]
    return [rounded(c, nd) for c in coords]


def clean_ring(ring):
    """Drop consecutive duplicates created by rounding; keep the ring closed."""
    out = [ring[0]]
    for p in ring[1:]:
        if p != out[-1]:
            out.append(p)
    if out[0] != out[-1]:
        out.append(out[0])
    return out


def clean_polygon(polygon):
    """A polygon is a list of rings. Drop rings that collapsed to nothing."""
    rings = [clean_ring(r) for r in polygon if r]
    rings = [r for r in rings if len(r) >= 4]
    # If the outer ring is gone the holes are meaningless too.
    return rings if rings and rings[0] is not None else []


def clean_geometry(geom: dict, nd: int) -> dict | None:
    """Round coordinates and remove degenerate rings/polygons. None if nothing is left."""
    coords = rounded(geom["coordinates"], nd)
    if geom["type"] == "Polygon":
        poly = clean_polygon(coords)
        return {"type": "Polygon", "coordinates": poly} if poly else None
    if geom["type"] == "MultiPolygon":
        polys = [p for p in (clean_polygon(c) for c in coords) if p]
        if not polys:
            return None
        if len(polys) == 1:
            return {"type": "Polygon", "coordinates": polys[0]}
        return {"type": "MultiPolygon", "coordinates": polys}
    return {"type": geom["type"], "coordinates": coords}


def slim(feature, props: dict, nd: int) -> dict | None:
    geom = clean_geometry(feature["geometry"], nd)
    if geom is None:
        return None
    return {"type": "Feature", "properties": props, "geometry": geom}


def build_world(src: Path) -> None:
    data = json.loads(src.read_text())
    features = []
    for f in data["features"]:
        p = f["properties"]
        if p.get("CONTINENT") in SKIP_CONTINENTS:
            continue
        iso3 = p.get("ISO_A3_EH") or p.get("ISO_A3") or p.get("ADM0_A3")
        feat = slim(f, {"name": p["ADMIN"], "iso3": iso3, "continent": p["CONTINENT"]}, nd=2)
        if feat:
            features.append(feat)
    OUT.mkdir(parents=True, exist_ok=True)
    out = OUT / "world.json"
    out.write_text(json.dumps({"type": "FeatureCollection", "features": features}, separators=(",", ":")))
    print(f"{out.relative_to(ROOT)}: {len(features)} countries, {out.stat().st_size // 1024} KB")


def build_states(src: Path, iso3_list: list[str]) -> None:
    data = json.loads(src.read_text())
    (OUT / "states").mkdir(parents=True, exist_ok=True)
    for iso3 in iso3_list:
        feats = [
            feat
            for f in data["features"]
            if f["properties"].get("adm0_a3") == iso3
            for feat in [slim(f, {"name": f["properties"]["name"], "code": f["properties"].get("iso_3166_2")}, nd=3)]
            if feat
        ]
        out = OUT / "states" / f"{iso3}.json"
        out.write_text(json.dumps({"type": "FeatureCollection", "features": feats}, separators=(",", ":")))
        print(f"{out.relative_to(ROOT)}: {len(feats)} regions, {out.stat().st_size // 1024} KB")


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    states = "IND"
    for a in sys.argv[1:]:
        if a.startswith("--states="):
            states = a.split("=", 1)[1]
    if len(args) < 2:
        sys.exit(__doc__)
    build_world(Path(args[0]))
    build_states(Path(args[1]), states.split(","))
