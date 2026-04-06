import express from 'express';
import cors from 'cors';
import { syncRouter } from './routes/sync.js';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.use('/api/sync', syncRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`NurtureOS backend running on http://localhost:${PORT}`);
});
