// ─── routes/ventas.routes.js ─────────────────────────────────────────────────
// SEGUNDA ENTREGA — Reescrito para exponer los endpoints de ventas.

import express from 'express';
import ventasController from '../controllers/ventas.controller.js';
import validarId from '../middlewares/validarId.middleware.js';

const router = express.Router();

router.get('/', ventasController.listar);
router.get('/:id', validarId, ventasController.obtenerUno);
router.post('/', ventasController.crear);
router.delete('/:id', validarId, ventasController.cancelar);

export default router;
