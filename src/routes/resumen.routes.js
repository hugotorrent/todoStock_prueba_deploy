// ─── routes/resumen.routes.js ─────────────────────────────────────────────────
// Segunda entrega — expone el endpoint del Dashboard DSS.

import express from 'express';
import resumenController from '../controllers/resumen.controller.js';

const router = express.Router();

router.get('/', resumenController.obtenerResumen); // GET /api/resumen

export default router;
