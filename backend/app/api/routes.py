from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app import config
from app.models import CONTRACT_VERSION, AnalysisRequest, AnalysisResult
from app.services.analysis import run_analysis

router = APIRouter(prefix="/api")


@router.get("/health")
def health() -> dict:
    return {"status": "ok", "contractVersion": CONTRACT_VERSION, "dataMode": config.DATA_MODE}


@router.post("/analyze", response_model=AnalysisResult, response_model_by_alias=True)
def analyze(request: AnalysisRequest) -> AnalysisResult:
    try:
        return run_analysis(request)
    except NotImplementedError as exc:
        raise HTTPException(status_code=501, detail=str(exc)) from exc
