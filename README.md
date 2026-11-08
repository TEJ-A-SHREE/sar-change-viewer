# SAR Change Viewer

See how a patch of the Earth changed between two dates using NISAR satellite radar (SAR) data, with
the result explained in plain language for people who are not remote-sensing experts.

```
pick an area + two dates  →  fetch NISAR scenes  →  compare them  →  render images  →  explain in words
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
./start.sh      # installs anything missing, starts API + UI, opens the browser
```

That is the only command most people need. Ctrl+C stops everything. On Windows,
double-click `start.cmd` (needs WSL). Manual alternative:

```bash
make setup      # install frontend (npm) and backend (uv)
make backend    # terminal 1: API on http://localhost:8000
make frontend   # terminal 2: UI  on http://localhost:5174
```

The app opens on an interactive world map. Hover a continent, click it, pick a country with
verified analyses (currently India), pick a state (currently Kerala), and open the analysis.
The compare tool itself lives at `/compare`. Results are synthetic until the fetch stage is
implemented (see ARCHITECTURE).

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

v0.2.0 plus unreleased: synthetic pipeline, space-themed explore map, NISAR as the only source.
Not an official NASA product.
