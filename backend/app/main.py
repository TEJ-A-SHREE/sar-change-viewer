"""FastAPI entry point. Run with: uv run uvicorn app.main:app --reload --port 8000"""

from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException

from app import config
from app.api.routes import router

app = FastAPI(title="SAR Change Viewer API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

config.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/outputs", StaticFiles(directory=config.OUTPUT_DIR), name="outputs")


# Every error leaves the API in the same shape: {"error": {"code", "message"}}.
@app.exception_handler(RequestValidationError)
async def _validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
    first = exc.errors()[0] if exc.errors() else {}
    loc = ".".join(str(p) for p in first.get("loc", []) if p != "body")
    msg = first.get("msg", "Invalid request")
    return JSONResponse(
        status_code=422,
        content={"error": {"code": "invalid_request", "message": f"{loc}: {msg}" if loc else msg}},
    )


@app.exception_handler(StarletteHTTPException)
async def _http_error(_: Request, exc: StarletteHTTPException) -> JSONResponse:
    code = {404: "not_found", 501: "not_implemented"}.get(exc.status_code, "http_error")
    return JSONResponse(
        status_code=exc.status_code, content={"error": {"code": code, "message": str(exc.detail)}}
    )
