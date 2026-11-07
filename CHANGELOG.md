# Changelog

All notable changes are recorded here. Versions follow [Semantic Versioning](https://semver.org)
and each release is a git tag (`git tag` to list, `git checkout v0.1.0` to look at one).

## Unreleased

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
