// ─── db/conexion.js ───────────────────────────────────────────────────────────
// Conexión a MongoDB usando la URI desde variables de entorno (.env).
// En desarrollo: mongodb://localhost:27017/todostock
// En producción: URI de Mongo Atlas (definida en la plataforma de despliegue)

import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/todostock';

async function conectarDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`✅ MongoDB conectado: ${MONGO_URI.split('@').pop()}`); // oculta credenciales en log
  } catch (error) {
    console.error('❌ Error al conectar con MongoDB:', error.message);
    process.exit(1);
  }
}

export default conectarDB;
