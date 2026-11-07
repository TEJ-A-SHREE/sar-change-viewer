# Changelog

All notable changes are recorded here. Versions follow [Semantic Versioning](https://semver.org)
and each release is a git tag (`git tag` to list, `git checkout v0.1.0` to look at one).

## Unreleased

## 0.2.0 — 2026-11-07

### Added
- `start.sh` / `start.cmd` one-command launcher: installs missing deps, starts API + UI,
  opens the browser, stops both on Ctrl+C. `make start` does the same.
- Explore map entry screen at `/`: hover a continent to highlight it, click to open a
  translucent panel of countries, pick a verified country to zoom in, then a verified state,
  then jump to the compare tool. Selection is in the URL (`?continent=Asia&country=IND&state=Kerala`).
- `frontend/src/data/coverage.ts`: the single list of verified places (India → Kerala).
- `scripts/build_map_data.py` + generated Natural Earth GeoJSON under `frontend/public/data/`.
- Techy visual style: Space Grotesk / JetBrains Mono, grid + scanline background, HUD panel.

### Changed
- Frontend dev port is 5174 (5173 collided with another app on the first dev machine).
- Compare tool moved to `/compare` and accepts `?region=<preset id>`.

## 0.1.0 — 2026-11-07

### Added
- Project scaffold: React + Vite + TypeScript frontend, FastAPI + numpy/matplotlib backend.
- Shared API contract (`shared/contracts/analysis.schema.json`) with TS and Python mirrors.
- Working end-to-end pipeline on synthetic data: fetch → process → visualize → analyze.
- Frontend UI: area and date picker, before/after/change image tabs, plain-language summary,
  key numbers, findings list, "How was this made?" disclosure. Falls back to sample data when
  the backend is offline.
- Docs: README, INSTRUCTIONS, HELP, CONTRIBUTING, docs/ARCHITECTURE, docs/DESIGN_BRIEF.
- CI (lint, format, tests, contract version check), PR and issue templates, Makefile.
