# Backend

FastAPI service. See `/INSTRUCTIONS.md` at the repo root for setup and `/docs/ARCHITECTURE.md`
for how the modules under `app/sar/` fit together.

```bash
uv sync            # create .venv and install everything
uv run uvicorn app.main:app --reload --port 8000
uv run pytest
uv run ruff check . && uv run ruff format .
```
