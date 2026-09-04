import { useState } from 'react';
import { api } from '../api.js';

// NOTE: this is a functional skeleton, not styled — Phase 6 (frontend build)
// is where this gets real layout/design. Right now it exists so the
// create-lot -> forecast -> match -> accept-offer flow can be tested end to end.
export default function FarmerDashboard() {
  const [lot, setLot] = useState(null);
  const [offers, setOffers] = useState([]);
  const [error, setError] = useState(null);

  async function handleCreateLot(e) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.target);
    try {
      const created = await api.createLot({
        commodity: form.get('commodity'),
        quantity_kg: Number(form.get('quantity_kg')),
        district: form.get('district'),
        lon: Number(form.get('lon')),
        lat: Number(form.get('lat')),
      });
      setLot(created);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleMatchBuyers() {
    if (!lot) return;
    const ranked = await api.matchBuyers(lot.id);
    setOffers(ranked);
  }

  return (
    <div>
      <h1>Create a Lot</h1>
      <form onSubmit={handleCreateLot} style={{ display: 'grid', gap: 8, maxWidth: 320 }}>
        <input name="commodity" placeholder="Commodity (e.g. Onion)" defaultValue="Onion" required />
        <input name="quantity_kg" type="number" placeholder="Quantity (kg)" required />
        <input name="district" placeholder="District" defaultValue="Nashik" required />
        <input name="lon" type="number" step="any" placeholder="Longitude" required />
        <input name="lat" type="number" step="any" placeholder="Latitude" required />
        <button type="submit">Create Lot</button>
      </form>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {lot && (
        <div style={{ marginTop: 24 }}>
          <h2>Price Forecast</h2>
          <p>
            ₹{lot.predicted_price_band_low} – ₹{lot.predicted_price_band_high}
            {' '}(confidence: {lot.forecast_confidence})
          </p>
          <button onClick={handleMatchBuyers}>Find Buyers</button>
        </div>
      )}

      {offers.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h2>Ranked Offers</h2>
          <ul>
            {offers.map((o) => (
              <li key={o.id}>
                ₹{o.offered_price} — net realisation ₹{o.net_realisation_score}
                {' '}<button onClick={() => api.acceptOffer(o.id)}>Accept</button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
