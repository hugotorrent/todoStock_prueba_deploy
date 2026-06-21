// ─── server.js ────────────────────────────────────────────────────────────────
// Punto de entrada del servidor.
// Integra Express + Socket.io para WebSockets en tiempo real.

import 'dotenv/config';
import { createServer } from 'http';
import { Server }       from 'socket.io';
import app              from './app.js';
import conectarDB       from './src/db/conexion.js';

const PORT = process.env.PORT || 3000;

// Crear servidor HTTP base (necesario para Socket.io)
const httpServer = createServer(app);

// Inicializar Socket.io sobre el servidor HTTP
const io = new Server(httpServer, {
  cors: { origin: '*' } // en producción restringir al dominio de Railway
});

// ── Eventos de WebSocket ───────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`🔌 Cliente WS conectado: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`🔌 Cliente WS desconectado: ${socket.id}`);
  });
});

// Exportar io para usarlo desde los controllers
export { io };

// ── Iniciar servidor ──────────────────────────────────────────────────────────
async function iniciar() {
  await conectarDB();
  httpServer.listen(PORT, () => {
    console.log(`🚀 Servidor TodoStock corriendo en http://localhost:${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/`);
    console.log(`🔌 WebSockets: activos`);
    console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
  });
}

iniciar();