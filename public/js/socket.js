export function conectarSocket(callbacks = {}) {
  const socket = io();

  socket.on('connect', () => {
    console.log('🔌 WebSocket conectado:', socket.id);
  });

  socket.on('venta:nueva', async (datos) => {
    console.log(`Venta nueva notificada: ${datos.cliente}`);
    await callbacks.onVentaNueva?.();
  });

  socket.on('venta:cancelada', async (datos) => {
    console.log(`Venta cancelada — ${datos.cliente}`);
    await callbacks.onVentaCancelada?.();
  });

  socket.on('disconnect', () => {
    console.log('🔌 WebSocket desconectado');
  });
}
