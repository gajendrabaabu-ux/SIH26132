"""
AgriLink360 AI service — price forecasting + buyer matching.

Currently returns plausible MOCK results so the backend/frontend can be built
and demoed end-to-end before the real models are trained. Replace the two
`# TODO(model)` sections with actual logic once you have:
  - price_history rows to train/query the forecasting model against
  - buyers + logistics_partners rows to rank against

Run: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI
from pydantic import BaseModel
from datetime import date, timedelta
import random

app = FastAPI(title="AgriLink360 AI Service")


class PriceRequest(BaseModel):
    commodity: str
    district: str
    quantity_kg: float


class PriceResponse(BaseModel):
    price_band_low: float
    price_band_high: float
    confidence: float
    recommended_sale_window_start: date
    recommended_sale_window_end: date


@app.post("/predict-price", response_model=PriceResponse)
def predict_price(req: PriceRequest):
    # TODO(model): replace with a real time-series model over price_history,
    # filtered by commodity + district, e.g. moving average + seasonality,
    # or a trained regression/forecasting model (Prophet, ARIMA, etc.)
    base_price = 1800  # placeholder ₹/quintal for onion, Nashik-area
    volatility = base_price * 0.12
    low = round(base_price - volatility, 2)
    high = round(base_price + volatility, 2)

    return PriceResponse(
        price_band_low=low,
        price_band_high=high,
        confidence=0.72,
        recommended_sale_window_start=date.today() + timedelta(days=1),
        recommended_sale_window_end=date.today() + timedelta(days=5),
    )


class MatchRequest(BaseModel):
    lot_id: str
    commodity: str
    quantity_kg: float
    lot_lon: float
    lot_lat: float
    quality_grade: str | None = None


class RankedOffer(BaseModel):
    buyer_id: str
    offered_price: float
    net_realisation_score: float


class MatchResponse(BaseModel):
    ranked_offers: list[RankedOffer]


@app.post("/match-buyers", response_model=MatchResponse)
def match_buyers(req: MatchRequest):
    # TODO(model): replace with a real ranking query:
    #   1. pull candidate buyers from Postgres filtered by commodity/quality fit
    #   2. compute distance via PostGIS ST_Distance(lot.location, buyer.location)
    #   3. score = f(offered_price, distance, buyer.payment_reliability_score, quantity fit)
    #   4. sort descending by net_realisation_score
    #
    # For now: generate a few mock ranked offers so the backend/frontend flow
    # can be built and demoed against something real-shaped.
    mock_buyers = ["buyer-demo-1", "buyer-demo-2", "buyer-demo-3"]
    offers = []
    for b in mock_buyers:
        price = round(1750 + random.uniform(-100, 150), 2)
        offers.append(RankedOffer(
            buyer_id=b,
            offered_price=price,
            net_realisation_score=round(price - random.uniform(20, 80), 2),
        ))
    offers.sort(key=lambda o: o.net_realisation_score, reverse=True)
    return MatchResponse(ranked_offers=offers)


@app.get("/health")
def health():
    return {"status": "ok"}
