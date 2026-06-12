// ─── middlewares/validarId.middleware.js ──────────────────────────────────────
// NUEVO en segunda entrega — no existía en la primera.
//
// En la primera entrega los ids eran strings como "prov-001", "cli-003".
// En la segunda entrega MongoDB genera ObjectIds automáticamente:
// strings hexadecimales de 24 caracteres (ej: "507f1f77bcf86cd799439011").
//
// Este middleware intercepta rutas con /:id y verifica que el id
// sea un ObjectId válido ANTES de que el controller lo busque en MongoDB.
// Si no es válido → responde 400 y el controller nunca se ejecuta.
//
// Se aplica POR RUTA (no globalmente) porque no todas las rutas tienen :id.

import mongoose from 'mongoose';

function validarId(req, res, next) {
  const { id } = req.params;

  // Si la ruta no tiene :id, pasamos sin validar
  if (!id) return next();

  // mongoose.Types.ObjectId.isValid() es la validación oficial de Mongoose
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      error: `El id "${id}" no es un ObjectId válido de MongoDB`,
      detalle: 'Debe ser un string hexadecimal de 24 caracteres.'
    });
  }

  // El id es válido, continuamos hacia el controller
  next();
}

export default validarId;