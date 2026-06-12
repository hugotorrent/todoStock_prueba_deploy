// ─── middlewares/validarJson.middleware.js ────────────────────────────────────
// NUEVO en segunda entrega — no existía en la primera.
//
// Captura el error que lanza express.json() cuando el body tiene JSON malformado.
// Ejemplo de body que activa este middleware:
//   { "nombre": "Test",, }   ← coma doble
//   { "nombre": "Test"       ← llave sin cerrar
//
// Sin este middleware, esos casos devuelven un 500 genérico sin explicación.
// Con este middleware, devuelven un 400 con un mensaje útil para el cliente.
//
// IMPORTANTE: tiene 4 parámetros (err, req, res, next).
// Express reconoce esa firma como un error handler — solo se activa
// cuando algo falló antes en la cadena, no en requests normales.

function validarJson(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: 'El body contiene JSON inválido',
      detalle: 'Verificá comillas dobles, sin comas extra, llaves bien cerradas.',
      ejemplo: '{ "nombre": "Lavandina", "precio": 850 }'
    });
  }
  // Si el error no es de JSON, lo pasamos al siguiente manejador
  next(err);
}

export default validarJson;