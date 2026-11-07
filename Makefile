# One-word commands for the whole team. Run `make` to list them.

.DEFAULT_GOAL := help
.PHONY: help start setup frontend backend dev test lint format check contract

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

start: ## Start everything and open the browser (same as ./start.sh)
	./start.sh

setup: ## Install everything (frontend + backend)
	cd frontend && npm install
	cd backend && uv sync

frontend: ## Run the UI on http://localhost:5174
	cd frontend && npm run dev

backend: ## Run the API on http://localhost:8000
	cd backend && uv run uvicorn app.main:app --reload --port 8000

dev: ## Run both (needs two terminals; this starts backend in background)
	(cd backend && uv run uvicorn app.main:app --reload --port 8000 &) && cd frontend && npm run dev

test: ## Run all tests
	cd backend && uv run pytest -q
	cd frontend && npm run typecheck

lint: ## Lint both sides
	cd backend && uv run ruff check .
	cd frontend && npm run lint && npm run format:check

format: ## Auto-format both sides
	cd backend && uv run ruff format . && uv run ruff check --fix .
	cd frontend && npm run format

contract: ## Check the three contract files agree on the version
	./scripts/check_contract.sh

check: lint contract test ## Everything CI runs
