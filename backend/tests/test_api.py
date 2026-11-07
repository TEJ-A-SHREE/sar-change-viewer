from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

REQUEST = {
    "area": {"name": "Test area", "bbox": [76.0, 9.5, 76.6, 10.2]},
    "beforeDate": "2024-06-01",
    "afterDate": "2024-09-01",
}


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_analyze_returns_contract_shape():
    r = client.post("/api/analyze", json=REQUEST)
    assert r.status_code == 200, r.text
    body = r.json()
    for key in (
        "id",
        "contractVersion",
        "request",
        "images",
        "summary",
        "findings",
        "stats",
        "metadata",
    ):
        assert key in body
    assert set(body["images"]) == {"before", "after", "change"}
    assert body["images"]["change"]["legend"]
    assert body["summary"]["confidence"] in {"low", "medium", "high"}
    assert body["metadata"]["synthetic"] is True


def test_rendered_images_are_served():
    body = client.post("/api/analyze", json=REQUEST).json()
    img = client.get(body["images"]["change"]["url"])
    assert img.status_code == 200
    assert img.headers["content-type"] == "image/png"


def test_bad_dates_rejected_with_error_shape():
    bad = {**REQUEST, "afterDate": "2024-01-01"}
    r = client.post("/api/analyze", json=bad)
    assert r.status_code == 422
    assert r.json()["error"]["code"] == "invalid_request"
