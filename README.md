# SAR Change Viewer

See how a patch of the Earth changed between two dates using satellite radar (SAR) data, with
the result explained in plain language for people who are not remote-sensing experts.

```
pick an area + two dates  →  fetch Sentinel-1 scenes  →  compare them  →  render images  →  explain in words
```

| Doc | Read it when |
|-----|--------------|
| [INSTRUCTIONS.md](INSTRUCTIONS.md) | You want to install, run, or start working on the project. |
| [HELP.md](HELP.md) | Something is not working, or you want to know what the app is showing you. |
| [CONTRIBUTING.md](CONTRIBUTING.md) | You are about to write code: tech stack, file conventions, git workflow. |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | You want to know how the pieces connect and where your code goes. |
| [docs/DESIGN_BRIEF.md](docs/DESIGN_BRIEF.md) | You want the why: goals, audience, assumptions, open questions. |
| [CHANGELOG.md](CHANGELOG.md) | You want to know what changed in each version. |

## Quick start

```bash
make setup      # install frontend (npm) and backend (uv)
make backend    # terminal 1: API on http://localhost:8000
make frontend   # terminal 2: UI  on http://localhost:5173
```

Open http://localhost:5173, press **Compare**, and you will see a synthetic result end to end.
Real satellite data arrives when the fetch stage is implemented (see ARCHITECTURE).

## Layout

```
frontend/   React + TypeScript UI (Vite, Tailwind)
backend/    FastAPI service and the SAR pipeline (app/sar/*)
shared/     The API contract both sides must obey
docs/       Architecture and design notes
scripts/    Helper scripts (contract check, GitHub publish)
.github/    CI and PR/issue templates
```

## Status

v0.1.0, scaffold with a working synthetic pipeline. Not an official NASA product.
