# Instructions

Step-by-step guide to set up the project, run it, and add your own work. If anything here
fails, check [HELP.md](HELP.md).

## 1. Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Git | any recent | https://git-scm.com |
| Node.js | 22 or newer | https://nodejs.org (use the LTS build) |
| uv (Python manager) | 0.4 or newer | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| GitHub CLI (optional) | any | https://cli.github.com, only needed for `gh pr create` |

You do not need to install Python yourself. `uv` downloads the pinned version
(`backend/.python-version`) into a project-local virtual environment.

## 2. Get the code

```bash
git clone <repo-url> sar-change-viewer
cd sar-change-viewer
make setup
```

`make setup` runs `npm install` in `frontend/` and `uv sync` in `backend/`.

## 3. Run it

One command:

```bash
./start.sh
```

It installs missing dependencies, starts the API (port 8000) and the UI (port 5174), opens
your browser, and stops both when you press Ctrl+C. Logs go to `.logs/`. Flags:
`--no-open` (do not open a browser), `--mocks` (UI only, sample data). Change ports with
`FRONTEND_PORT=5180 BACKEND_PORT=8010 ./start.sh`. Windows users: `start.cmd` runs it in WSL.

Manual alternative, two terminals:

```bash
make backend     # API at http://localhost:8000  (docs at http://localhost:8000/docs)
make frontend    # UI  at http://localhost:5174
```

The UI proxies every `/api/*` call to the backend, so no CORS setup is needed in development.
If the backend is not running the UI still works and shows clearly labelled sample data.

Frontend-only work without any backend: copy `frontend/.env.example` to `frontend/.env.local`
and set `VITE_USE_MOCKS=true`.

## 4. Before you push

```bash
make check       # lint + format check + contract check + tests, same as CI
```

Fix formatting automatically with `make format`.

## 5. Day-to-day workflow

1. `git checkout main && git pull`
2. `git checkout -b <type>/<short-name>` (see branch naming in CONTRIBUTING.md)
3. Make your change. Keep it to one stage or one feature.
4. Add a line under **Unreleased** in `CHANGELOG.md`.
5. `make check`
6. `git commit` using the message format in CONTRIBUTING.md
7. `git push -u origin <branch>` then open a pull request (`gh pr create` or the GitHub UI).
8. CI must be green and one teammate must approve before merging to `main`.

## 6. Where does my code go?

| You are working on | Put code in | Entry point to change |
|--------------------|-------------|-----------------------|
| Explore map (entry screen) | `frontend/src/pages/ExplorePage.tsx`, `frontend/src/components/map/` | `ExplorePage.tsx` |
| Which places are "verified" | `frontend/src/data/coverage.ts` | add a state under its country |
| Compare tool UI | `frontend/src/components/`, `frontend/src/pages/` | `frontend/src/pages/ComparePage.tsx` |
| Downloading SAR scenes | `backend/app/sar/fetch.py` | implement `fetch_scene()` |
| Filtering / change maths | `backend/app/sar/process.py` | `compute_change()` |
| matplotlib images | `backend/app/sar/visualize.py` | `render_*()` |
| Plain-language text | `backend/app/sar/analyze.py` | `explain()` |
| API shape | `shared/contracts/analysis.schema.json` + both mirrors | see CONTRIBUTING "Changing the contract" |

Each `backend/app/sar/*.py` file has a header docstring stating its owner, its input and its
output. Keep those functions pure (arrays in, arrays out) and they will plug straight into
`backend/app/services/analysis.py`, which is the only file that calls all four stages.

## 7. Adding a newly verified region to the map

1. Add the state under its country in `frontend/src/data/coverage.ts` (bbox, scene count,
   latest scene date). Names must match Natural Earth names used in `frontend/public/data/`.
2. Add a matching preset with the same `regionId` in `frontend/src/lib/regions.ts`.
3. If the country has no state boundaries yet, regenerate the map data:

   ```bash
   # download the two Natural Earth files listed at the top of scripts/build_map_data.py, then
   python3 -I scripts/build_map_data.py ne_50m_admin_0_countries.geojson \
       ne_50m_admin_1_states_provinces.geojson --states=IND,USA
   ```

   Commit the regenerated files under `frontend/public/data/`; do not commit the downloads.

## 8. Switching from synthetic to real data

The backend runs in `synthetic` mode by default. Once `fetch_scene()` works:

```bash
cd backend
SAR_DATA_MODE=live uv run uvicorn app.main:app --reload --port 8000
```

All settings are environment variables listed in `backend/app/config.py`.

## 9. Navigating versions

Every release is a git tag. To see what the project looked like at a version:

```bash
git tag                 # list versions
git checkout v0.1.0     # look around
git checkout main       # come back
git log --oneline       # every commit, newest first
```

`CHANGELOG.md` is the human-readable version of the same history.

## 10. Publishing to GitHub for the first time (maintainer only)

```bash
gh auth login
./scripts/publish_to_github.sh sar-change-viewer private
```

This creates the repo, pushes `main` and the tags, and turns on branch protection so changes
go through pull requests with passing CI.
