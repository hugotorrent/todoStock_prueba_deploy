// ─── routes/auditoria.routes.js ───────────────────────────────────────────────
// NUEVO en segunda entrega — no existía en la primera.
// Expone el log de operaciones registradas por el logger middleware.

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

// Reconstrucción de __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_PATH = path.join(__dirname, '../data/auditoria.json');

// GET /api/auditoria — devuelve los últimos 100 registros, del más reciente al más antiguo
router.get('/', (req, res) => {
  try {
    const logs = JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8'));
    res.status(200).json({ total: logs.length, registros: logs.reverse() });
  } catch {
    res.status(500).json({ error: 'No se pudo leer el log de auditoría' });
  }
});

export default router;