import express from 'express';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json({limit: '1mb'}));

  app.post('/api/order', (req, res) => {
    const {name, phone, delivery, address, payment, items, total} = req.body ?? {};

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof phone !== 'string' ||
      phone.replace(/\D/g, '').length < 7 ||
      !Array.isArray(items) ||
      items.length === 0 ||
      typeof total !== 'number' ||
      total <= 0
    ) {
      res.status(400).json({ok: false, error: "Buyurtma ma'lumotlari to'liq emas."});
      return;
    }

    const orderId = `ONX-${Math.floor(100000 + Math.random() * 900000)}`;
    res.status(200).json({
      ok: true,
      orderId,
      receivedAt: new Date().toISOString(),
      delivery: typeof delivery === 'string' ? delivery : 'Yetkazib berish',
      address: typeof address === 'string' ? address : '',
      payment: typeof payment === 'string' ? payment : 'Naqd',
      total,
    });
  });

  if (!isProd) {
    const {createServer: createViteServer} = await import('vite');
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build artifacts not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ONEX server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
