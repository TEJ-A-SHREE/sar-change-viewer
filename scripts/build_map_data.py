#!/usr/bin/env python3
"""Build the slim GeoJSON files the explore map uses.

Reads Natural Earth GeoJSON (public domain) and writes:
  frontend/public/data/world.json          countries with name / iso3 / continent
  frontend/public/data/states/<ISO3>.json  admin-1 regions for countries we care about

Usage:
  python3 -I scripts/build_map_data.py <ne_50m_admin_0_countries.geojson> \
      <ne_50m_admin_1_states_provinces.geojson> [--states=IND,USA]

Sources (download once, do not commit):
  https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson
  https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_1_states_provinces.geojson

Why this script exists instead of using Natural Earth as-is
-----------------------------------------------------------
Natural Earth tags every *country* with one continent. That is wrong for the
map's purposes in a few places, and it made the old map look broken:

  * Russia was entirely "Europe", so hovering Europe lit up Siberia to the
    Bering Strait and the Europe zoom spanned the whole globe.
  * France includes French Guiana, Guadeloupe, Martinique, Réunion and Mayotte
    in one feature, so "Europe" stretched to South America and the Indian Ocean.
  * The Netherlands includes its Caribbean islands; the USA includes Hawaii.
  * Sub-Antarctic specks (Prince Edward Islands, Kerguelen) dragged Africa and
    Asia bounds down toward Antarctica.

This script splits those features by polygon piece and assigns each piece to
the continent it is physically on. Russia is cut along 60°E (the Urals).

Only the standard library is used so anyone can run it.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "frontend" / "public" / "data"

SKIP_CONTINENTS = {"Seven seas (open ocean)", "Antarctica"}

# Decimal places kept. 2 ≈ 1.1 km at the equator, plenty for a 1000px world map.
WORLD_DECIMALS = 2
STATE_DECIMALS = 3
# Douglas–Peucker tolerance in degrees. 0.02° is 0.06 px on the 1000 px world
# view and under half a pixel at the deepest country zoom.
WORLD_TOLERANCE = 0.02
STATE_TOLERANCE = 0.0

Point = list[float]
Ring = list[Point]
Polygon = list[Ring]

# --------------------------------------------------------------------------- geometry helpers


def rounded(coords, nd: int):
    if isinstance(coords[0], (int, float)):
        return [round(coords[0], nd), round(coords[1], nd)]
    return [rounded(c, nd) for c in coords]


def clean_ring(ring: Ring) -> Ring:
    """Drop consecutive duplicates created by rounding; keep the ring closed."""
    out = [ring[0]]
    for p in ring[1:]:
        if p != out[-1]:
            out.append(p)
    if out[0] != out[-1]:
        out.append(out[0])
    return out


def clean_polygon(polygon: Polygon) -> Polygon:
    rings = [clean_ring(r) for r in polygon if r]
    rings = [r for r in rings if len(r) >= 4]
    return rings


def simplify_ring(ring: Ring, tol: float) -> Ring:
    """Douglas–Peucker. Keeps the first/last point so the ring stays closed."""
    if tol <= 0 or len(ring) < 5:
        return ring
    keep = [False] * len(ring)
    keep[0] = keep[-1] = True
    stack = [(0, len(ring) - 1)]
    while stack:
        a, b = stack.pop()
        ax, ay = ring[a]
        bx, by = ring[b]
        dx, dy = bx - ax, by - ay
        norm = (dx * dx + dy * dy) ** 0.5
        best, best_i = -1.0, -1
        for i in range(a + 1, b):
            px, py = ring[i]
            d = abs(dx * (ay - py) - dy * (ax - px)) / norm if norm else ((px - ax) ** 2 + (py - ay) ** 2) ** 0.5
            if d > best:
                best, best_i = d, i
        if best > tol:
            keep[best_i] = True
            stack.append((a, best_i))
            stack.append((best_i, b))
    out = [pt for pt, k in zip(ring, keep) if k]
    return out if len(out) >= 4 else ring


def ring_area_centroid(r: Ring) -> tuple[float, float, float]:
    """Planar shoelace area (deg², sign dropped) and centroid of a ring."""
    a = cx = cy = 0.0
    for i in range(len(r) - 1):
        x0, y0 = r[i]
        x1, y1 = r[i + 1]
        c = x0 * y1 - x1 * y0
        a += c
        cx += (x0 + x1) * c
        cy += (y0 + y1) * c
    a /= 2
    if abs(a) < 1e-12:
        return 0.0, r[0][0], r[0][1]
    return abs(a), cx / (6 * a), cy / (6 * a)


def clip_ring_halfplane(ring: Ring, x: float, keep_west: bool) -> Ring:
    """Sutherland–Hodgman clip of a ring against the meridian `x`."""

    def inside(p: Point) -> bool:
        return p[0] <= x if keep_west else p[0] >= x

    def intersect(a: Point, b: Point) -> Point:
        t = (x - a[0]) / (b[0] - a[0])
        return [x, a[1] + t * (b[1] - a[1])]

    out: Ring = []
    pts = ring[:-1] if ring[0] == ring[-1] else ring
    for i, cur in enumerate(pts):
        prev = pts[i - 1]
        if inside(cur):
            if not inside(prev):
                out.append(intersect(prev, cur))
            out.append(cur)
        elif inside(prev):
            out.append(intersect(prev, cur))
    if len(out) < 3:
        return []
    out.append(out[0])
    return out


def split_polygon_at_meridian(poly: Polygon, x: float) -> tuple[Polygon, Polygon]:
    """Return (west, east) parts of a polygon (outer ring only; Russia has no holes)."""
    west = clip_ring_halfplane(poly[0], x, keep_west=True)
    east = clip_ring_halfplane(poly[0], x, keep_west=False)
    return ([west] if west else []), ([east] if east else [])


def polygons_of(geom: dict) -> list[Polygon]:
    if geom["type"] == "Polygon":
        return [geom["coordinates"]]
    if geom["type"] == "MultiPolygon":
        return geom["coordinates"]
    return []


def geometry_from(polys: list[Polygon], nd: int, tol: float = 0.0) -> dict | None:
    polys = [[simplify_ring(r, tol) for r in poly] for poly in polys]
    polys = [p for p in (clean_polygon(rounded(poly, nd)) for poly in polys) if p]
    if not polys:
        return None
    if len(polys) == 1:
        return {"type": "Polygon", "coordinates": polys[0]}
    return {"type": "MultiPolygon", "coordinates": polys}


# --------------------------------------------------------------------------- continent rules

# For countries whose territory spans several continents, each polygon piece is
# routed by its centroid. Rules are (test(lon, lat) -> bool, feature name, continent).
# The first matching rule wins; unmatched pieces stay with the parent feature.
# `None` as a continent drops the piece (sub-Antarctic islands).
PIECE_RULES: dict[str, list] = {
    "France": [
        (lambda x, y: x < -30 and y < 10, "French Guiana", "South America"),
        (lambda x, y: x < -30, "Guadeloupe & Martinique", "North America"),
        (lambda x, y: x > 40 and y < 0, "Réunion & Mayotte", "Africa"),
    ],
    "Netherlands": [
        (lambda x, y: x < -30, "Caribbean Netherlands", "North America"),
    ],
    "United States of America": [
        (lambda x, y: x < -150 and y < 30, "Hawaii", "Oceania"),
    ],
    "South Africa": [
        (lambda x, y: y < -40, None, None),  # Prince Edward Islands
    ],
    "Australia": [
        (lambda x, y: y < -50, None, None),  # Heard & McDonald Islands
    ],
    "Norway": [
        (lambda x, y: y < -50, None, None),  # Bouvet Island
    ],
}

# Russia is cut along the Urals. Pieces entirely east of the antimeridian
# (Chukotka's tip, longitude ≈ -170) are Asian too.
RUSSIA_SPLIT_LON = 60.0


def continent_fix(name: str, continent: str) -> str:
    """Whole-country overrides where Natural Earth's label reads wrong on a map."""
    return {
        "Cyprus": "Europe",  # EU member; sits next to Greece in the Europe list
    }.get(name, continent)


def split_country(feature: dict) -> list[tuple[str, str, str, list[Polygon]]]:
    """Return [(name, iso3, continent, polygons)] for a Natural Earth country."""
    p = feature["properties"]
    name = p["ADMIN"]
    iso3 = p.get("ISO_A3_EH") or p.get("ISO_A3") or p.get("ADM0_A3")
    continent = continent_fix(name, p["CONTINENT"])
    polys = polygons_of(feature["geometry"])

    if name == "Russia":
        europe: list[Polygon] = []
        asia: list[Polygon] = []
        for poly in polys:
            _, cx, _ = ring_area_centroid(poly[0])
            if cx < 0:
                asia.append(poly)
                continue
            w, e = split_polygon_at_meridian(poly, RUSSIA_SPLIT_LON)
            if w:
                europe.append(w)
            if e:
                asia.append(e)
        return [("Russia", iso3, "Europe", europe), ("Russia", iso3, "Asia", asia)]

    rules = PIECE_RULES.get(name)
    if not rules:
        return [(name, iso3, continent, polys)]

    groups: dict[tuple[str, str], list[Polygon]] = {(name, continent): []}
    for poly in polys:
        _, cx, cy = ring_area_centroid(poly[0])
        for test, new_name, new_continent in rules:
            if test(cx, cy):
                if new_name is not None:
                    groups.setdefault((new_name, new_continent), []).append(poly)
                break
        else:
            groups[(name, continent)].append(poly)
    return [(n, iso3, c, ps) for (n, c), ps in groups.items() if ps]


# --------------------------------------------------------------------------- builders


def build_world(src: Path) -> None:
    data = json.loads(src.read_text())
    features = []
    for f in data["features"]:
        if f["properties"].get("CONTINENT") in SKIP_CONTINENTS:
            continue
        for name, iso3, continent, polys in split_country(f):
            geom = geometry_from(polys, WORLD_DECIMALS, WORLD_TOLERANCE)
            if geom is None:
                continue
            features.append(
                {
                    "type": "Feature",
                    "properties": {"name": name, "iso3": iso3, "continent": continent},
                    "geometry": geom,
                }
            )
    OUT.mkdir(parents=True, exist_ok=True)
    out = OUT / "world.json"
    out.write_text(json.dumps({"type": "FeatureCollection", "features": features}, separators=(",", ":")))
    print(f"{out.relative_to(ROOT)}: {len(features)} features, {out.stat().st_size // 1024} KB")


def build_states(src: Path, iso3_list: list[str]) -> None:
    data = json.loads(src.read_text())
    (OUT / "states").mkdir(parents=True, exist_ok=True)
    for iso3 in iso3_list:
        feats = []
        for f in data["features"]:
            if f["properties"].get("adm0_a3") != iso3:
                continue
            geom = geometry_from(polygons_of(f["geometry"]), STATE_DECIMALS, STATE_TOLERANCE)
            if geom is None:
                continue
            feats.append(
                {
                    "type": "Feature",
                    "properties": {"name": f["properties"]["name"], "code": f["properties"].get("iso_3166_2")},
                    "geometry": geom,
                }
            )
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
