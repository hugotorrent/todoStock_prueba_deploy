// ─── routes/productos.routes.js ───────────────────────────────────────────────
// SEGUNDA ENTREGA — validarId agregado en rutas con :id.

import express from 'express';
import productosController from '../controllers/productos.controller.js';
import validarId from '../middlewares/validarId.middleware.js';

const router = express.Router();

router.get('/',       productosController.obtenerTodos);
router.get('/:id',    validarId, productosController.obtenerPorId);
router.post('/',      productosController.crearProducto);
router.put('/:id',    validarId, productosController.actualizarProducto);
router.delete('/:id', validarId, productosController.eliminarProducto);

export default router;