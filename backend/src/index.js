import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import { authRouter } from './routes/auth.js';
import { lotsRouter } from './routes/lots.js';
import { offersRouter } from './routes/offers.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRouter);
app.use('/api/lots', lotsRouter);
app.use('/api/offers', offersRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`AgriLink360 backend listening on :${PORT}`));
