// ─── server.js ────────────────────────────────────────────────────────────────
// Punto de entrada del servidor.
// Carga las variables de entorno ANTES de importar cualquier módulo
// que las necesite (db/conexion.js, auth.middleware.js).

import 'dotenv/config';  // carga .env automáticamente
import app        from './app.js';
import conectarDB from './src/db/conexion.js';

const PORT = process.env.PORT || 3000;

async function iniciar() {
  await conectarDB();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor TodoStock corriendo en http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/resumen`);
    console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  });
}

iniciar();
