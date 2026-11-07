# Help

Two halves: **using the app** (for anyone) and **fixing the setup** (for the team).

---

## Using the app

### The first screen is a map. What do I do?

Hover a continent and it lights up. Click it to open a panel listing its countries; the ones
with a **Verified** tag have analyses ready. Click a country to zoom in and see its states,
then click a highlighted state and press **Open analysis**. Press Esc or use the breadcrumb at
the top-left to go back. Every level has a shareable address, e.g.
`/?continent=Asia&country=IND&state=Kerala`.

"Verified" means the data team has confirmed usable radar scenes for that place. Because
NISAR / Sentinel-1 coverage is uneven, we only list places we are sure about.

### What am I looking at in the compare tool?

Radar satellites such as Sentinel-1 send a pulse at the ground and measure how much bounces
back. Rough or hard things (buildings, rocky ground, choppy water) bounce a lot and show up
**bright**. Smooth things (calm water, flat bare soil, roads) bounce the signal away and show
up **dark**. Unlike a camera, radar works through clouds and at night, which is why it is used
for floods and disasters.

The app shows three images:

| Tab | Meaning |
|-----|---------|
| **Before** | The radar image on the earlier date. |
| **After** | The radar image on the later date, same brightness scale. |
| **What changed** | Teal: little change. Blue: became darker. Orange: became brighter. |

### What does "became darker" usually mean?

Most often: water appeared (a flood, a filled reservoir, a wet field), or vegetation was
cleared leaving smooth soil. The app says "usually" on purpose. Radar cannot tell *why* a
surface changed, only *that* it did, so treat the explanation as a strong hint, not proof.

### What does "became brighter" usually mean?

New buildings or construction, water that drained away, or crops that grew tall and rough.

### What does the confidence label mean?

- **High**: the change (or lack of it) is far above the normal radar noise.
- **Medium**: a clear pattern, but some of the flagged pixels could be noise.
- **Low**: small or scattered changes; look at the images yourself before drawing conclusions.

### Why does the header say "showing sample data"?

The backend service is not running or cannot be reached, so the app shows a built-in example.
Nothing in a sample result is about the area you picked. See "Backend offline" below.

### The dates I picked give the same result every time

In this version the backend runs in **synthetic** mode: it fabricates radar scenes so the
whole flow can be tested. Real data arrives when the fetch stage is implemented
(`backend/app/sar/fetch.py`).

---

## Fixing the setup

### `./start.sh` says a port is busy

Another program uses that port. `FRONTEND_PORT=5180 ./start.sh` or `BACKEND_PORT=8010 ./start.sh`.

### `./start.sh`: permission denied

`chmod +x start.sh` once, or run `bash start.sh`.

### `make: command not found`

- Ubuntu / WSL: `sudo apt install make`
- macOS: `xcode-select --install`
- Windows without WSL: run the underlying commands shown in the `Makefile` directly, e.g.
  `cd frontend && npm run dev`.

### `uv: command not found`

Install it: `curl -LsSf https://astral.sh/uv/install.sh | sh`, then open a new terminal.

### The browser shows a completely different app at localhost:5174

Another program on your computer is listening on that port. On WSL, Windows programs win
over WSL ones for the same port, so the launcher's own check may not notice. Start on a
different port: `FRONTEND_PORT=5180 ./start.sh`. (This is why the default is 5174 and not
Vite's usual 5173: a Windows app on the first dev machine already used 5173.)

### Backend offline / "Backend offline · showing sample data"

1. Is it running? `make backend` should print `Uvicorn running on http://127.0.0.1:8000`.
2. Is the port taken? `lsof -i :8000` (Linux/macOS). Stop the other process or change the
   port in both the `make backend` command and `frontend/vite.config.ts`.
3. Does `curl http://localhost:8000/api/health` return `{"status":"ok", ...}`?

### `npm run build` fails with type errors

Run `npm run typecheck` in `frontend/` to see them all. The most common cause is a change to
the API contract on one side only. See CONTRACT below.

### `pytest` fails on `test_api.py`

Run `uv run pytest -q -x` in `backend/` to stop at the first failure. If the error mentions a
missing field, a teammate probably changed the contract. Pull `main` and `uv sync` again.

### CI says "contract versions differ"

`shared/contracts/analysis.schema.json`, `frontend/src/types/analysis.ts` and
`backend/app/models.py` must declare the same `contractVersion`. Update all three in the same
pull request. `make contract` checks this locally.

### I committed a large `.tif` / `.zip` by mistake

Data files are ignored by `.gitignore`, but if one got in:

```bash
git rm --cached path/to/file
git commit -m "chore: remove data file"
```

If it was already pushed, tell the maintainer; history needs rewriting to shrink the repo.

### Matplotlib errors about a display / `tkinter`

The backend forces the `Agg` backend in `visualize.py`. If you import matplotlib in your own
script, call `matplotlib.use("Agg")` before `import matplotlib.pyplot`.

### Still stuck?

Open an issue with the **Task** template, paste the full command and error, and say which OS
you are on.
