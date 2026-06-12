// ─── routes/proveedores.routes.js ────────────────────────────────────────────
// SEGUNDA ENTREGA — validarId agregado en rutas con :id.
// El resto de endpoints es igual a la primera entrega.

import express from 'express';
import proveedoresController from '../controllers/proveedores.controller.js';
import validarId from '../middlewares/validarId.middleware.js';

const router = express.Router();

router.get('/',       proveedoresController.obtenerTodos);
router.get('/:id',    validarId, proveedoresController.obtenerPorId);
router.post('/',      proveedoresController.crearProveedor);
router.put('/:id',    validarId, proveedoresController.actualizarProveedor);
router.delete('/:id', validarId, proveedoresController.eliminarProveedor);

export default router;