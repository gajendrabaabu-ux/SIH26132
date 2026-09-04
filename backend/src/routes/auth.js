import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

export const authRouter = Router();

authRouter.post('/register', async (req, res) => {
  const { role, name, phone, password, village, district, state, lon, lat } = req.body;
  if (!role || !name || !phone || !password) {
    return res.status(400).json({ error: 'role, name, phone, password are required' });
  }

  const password_hash = await bcrypt.hash(password, 10);
  const point = lon && lat ? `SRID=4326;POINT(${lon} ${lat})` : null;

  try {
    const { rows } = await pool.query(
      `INSERT INTO users (role, name, phone, password_hash, village, district, state, location)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, role, name, phone`,
      [role, name, phone, password_hash, village, district, state, point]
    );

    if (role === 'buyer') {
      await pool.query(
        `INSERT INTO buyers (user_id, business_name) VALUES ($1, $2)`,
        [rows[0].id, req.body.business_name || name]
      );
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Phone already registered' });
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

authRouter.post('/login', async (req, res) => {
  const { phone, password } = req.body;
  const { rows } = await pool.query('SELECT * FROM users WHERE phone = $1', [phone]);
  const user = rows[0];

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid phone or password' });
  }

  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
});
