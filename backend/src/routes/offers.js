import { Router } from 'express';
import { pool } from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const offersRouter = Router();

// Farmer accepts one ranked offer -> creates a transaction, rejects the rest.
offersRouter.post('/:id/accept', requireAuth, requireRole('farmer', 'fpo_coordinator'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `SELECT o.*, l.farmer_id FROM offers o JOIN lots l ON l.id = o.lot_id WHERE o.id = $1`,
      [req.params.id]
    );
    const offer = rows[0];
    if (!offer || offer.farmer_id !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Offer not found' });
    }

    await client.query(`UPDATE offers SET status = 'accepted' WHERE id = $1`, [offer.id]);
    await client.query(`UPDATE offers SET status = 'rejected' WHERE lot_id = $1 AND id != $2`, [offer.lot_id, offer.id]);
    await client.query(`UPDATE lots SET status = 'offer_accepted' WHERE id = $1`, [offer.lot_id]);

    const { rows: txRows } = await client.query(
      `INSERT INTO transactions (lot_id, offer_id) VALUES ($1, $2) RETURNING *`,
      [offer.lot_id, offer.id]
    );

    await client.query('COMMIT');
    res.status(201).json(txRows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Could not accept offer' });
  } finally {
    client.release();
  }
});
