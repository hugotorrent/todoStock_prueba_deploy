// ─── routes/clientes.routes.js ────────────────────────────────────────────────
// SEGUNDA ENTREGA — Ampliado respecto a la primera entrega.
//
//
// SEGUNDA ENTREGA agrega:
//   GET  /api/clientes/:id/credito  — consultar crédito disponible
//   POST /api/clientes/:id/pagos    — registrar pago de deuda
//   + validarId en todas las rutas con :id

import express from 'express';
import clientesController from '../controllers/clientes.controller.js';
import validarId from '../middlewares/validarId.middleware.js';

const router = express.Router();

router.get('/',             clientesController.listar);
router.get('/:id',          validarId, clientesController.obtenerUno);
router.get('/:id/credito',  validarId, clientesController.consultarCredito); // NUEVO
router.post('/',            clientesController.crear);
router.post('/:id/pagos',   validarId, clientesController.registrarPago);    // NUEVO
router.put('/:id',          validarId, clientesController.actualizar);
router.delete('/:id',       validarId, clientesController.desactivar);       // CAMBIO: antes eliminaba, ahora desactiva

export default router;