import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { predictPrice, matchBuyers } from '../services/aiService.js';

export const lotsRouter = Router();

// Create a lot, then immediately fetch a price forecast for it.
lotsRouter.post('/', requireAuth, requireRole('farmer', 'fpo_coordinator'), async (req, res) => {
  const { commodity, quantity_kg, district, lon, lat } = req.body;
  if (!commodity || !quantity_kg || !district || lon == null || lat == null) {
    return res.status(400).json({ error: 'commodity, quantity_kg, district, lon, lat are required' });
  }

  const { rows } = await pool.query(
    `INSERT INTO lots (farmer_id, commodity, quantity_kg, district, location)
     VALUES ($1, $2, $3, $4, ST_SetSRID(ST_MakePoint($5, $6), 4326))
     RETURNING *`,
    [req.user.id, commodity, quantity_kg, district, lon, lat]
  );
  const lot = rows[0];

  try {
    const forecast = await predictPrice({ commodity, district, quantity_kg });
    const updated = await pool.query(
      `UPDATE lots SET
         predicted_price_band_low = $1,
         predicted_price_band_high = $2,
         forecast_confidence = $3
       WHERE id = $4 RETURNING *`,
      [forecast.price_band_low, forecast.price_band_high, forecast.confidence, lot.id]
    );
    return res.status(201).json(updated.rows[0]);
  } catch (err) {
    // Lot is still created even if the forecast call fails — don't block the farmer.
    console.error('Forecast unavailable:', err.message);
    return res.status(201).json({ ...lot, forecast_error: 'Forecast temporarily unavailable' });
  }
});

// List the calling farmer's own lots.
lotsRouter.get('/mine', requireAuth, requireRole('farmer', 'fpo_coordinator'), async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM lots WHERE farmer_id = $1 ORDER BY created_at DESC', [req.user.id]);
  res.json(rows);
});

// Trigger buyer matching for a lot, store ranked offers.
lotsRouter.post('/:id/match-buyers', requireAuth, requireRole('farmer', 'fpo_coordinator'), async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, commodity, quantity_kg, quality_grade, ST_X(location::geometry) AS lon, ST_Y(location::geometry) AS lat
     FROM lots WHERE id = $1 AND farmer_id = $2`,
    [req.params.id, req.user.id]
  );
  const lot = rows[0];
  if (!lot) return res.status(404).json({ error: 'Lot not found' });

  const { ranked_offers } = await matchBuyers({
    lot_id: lot.id,
    commodity: lot.commodity,
    quantity_kg: lot.quantity_kg,
    lot_lon: lot.lon,
    lot_lat: lot.lat,
    quality_grade: lot.quality_grade,
  });

  const inserted = [];
  for (const [i, o] of ranked_offers.entries()) {
    const { rows: offerRows } = await pool.query(
      `INSERT INTO offers (lot_id, buyer_id, offered_price, net_realisation_score, match_rank)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [lot.id, o.buyer_id, o.offered_price, o.net_realisation_score, i + 1]
    );
    inserted.push(offerRows[0]);
  }

  await pool.query(`UPDATE lots SET status = 'offers_open' WHERE id = $1`, [lot.id]);
  res.json(inserted);
});
