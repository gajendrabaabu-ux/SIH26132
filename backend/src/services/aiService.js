// Thin client for the ai-service (FastAPI) microservice.
// Keeping this in one file means if the AI service's contract changes,
// only this file needs to change — routes just call these functions.

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export async function predictPrice({ commodity, district, quantity_kg }) {
  const res = await fetch(`${AI_SERVICE_URL}/predict-price`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ commodity, district, quantity_kg }),
  });
  if (!res.ok) throw new Error(`ai-service predict-price failed: ${res.status}`);
  return res.json();
}

export async function matchBuyers({ lot_id, commodity, quantity_kg, lot_lon, lot_lat, quality_grade }) {
  const res = await fetch(`${AI_SERVICE_URL}/match-buyers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lot_id, commodity, quantity_kg, lot_lon, lot_lat, quality_grade }),
  });
  if (!res.ok) throw new Error(`ai-service match-buyers failed: ${res.status}`);
  return res.json();
}
