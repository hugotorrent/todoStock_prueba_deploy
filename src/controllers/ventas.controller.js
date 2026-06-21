// ─── controllers/ventas.controller.js ────────────────────────────────────────
// Emite eventos WebSocket al crear y cancelar ventas para actualizar
// en tiempo real todos los clientes conectados al panel.

import VentaModel from '../models/venta.model.js';

// Importar io dinámicamente para evitar dependencia circular
let io;
async function obtenerIo() {
  if (!io) {
    const mod = await import('../../server.js');
    io = mod.io;
  }
  return io;
}

// ── Listar ventas ─────────────────────────────────────────────────────────────
async function listar(req, res) {
  try {
    const ventas = await VentaModel.obtenerTodos();
    res.status(200).json(ventas);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ventas', detalle: error.message });
  }
}

// ── Obtener una venta ─────────────────────────────────────────────────────────
async function obtenerUno(req, res) {
  try {
    const venta = await VentaModel.obtenerPorId(req.params.id);
    if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });
    res.status(200).json(venta);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener venta', detalle: error.message });
  }
}

// ── Crear venta ───────────────────────────────────────────────────────────────
async function crear(req, res) {
  try {
    const { clienteId, modalidad, items } = req.body;

    if (!clienteId || !items?.length) {
      return res.status(400).json({ error: 'clienteId e items son requeridos' });
    }

    const { venta, alertasStock } = await VentaModel.crear({ clienteId, modalidad, items });

    // Emitir evento WebSocket — todos los clientes conectados actualizan su tabla
    const socket = await obtenerIo();
    socket.emit('venta:nueva', {
      id:       venta._id,
      cliente:  venta.clienteId?.razonSocial || clienteId,
      total:    venta.total,
      modalidad: venta.modalidad,
      alertas:  alertasStock,
    });

    res.status(201).json({ venta, alertasStock });
  } catch (error) {
    const status = error.message.includes('crédito') || error.message.includes('stock') ? 422 : 500;
    res.status(status).json({ error: error.message });
  }
}

// ── Cancelar venta ────────────────────────────────────────────────────────────
async function cancelar(req, res) {
  try {
    const venta = await VentaModel.cancelar(req.params.id);

    // Emitir evento WebSocket — todos los clientes actualizan la tabla
    const socket = await obtenerIo();
    socket.emit('venta:cancelada', {
      id:      venta._id,
      cliente: venta.clienteId?.razonSocial || '—',
      total:   venta.total,
    });

    res.status(200).json({ mensaje: 'Venta cancelada correctamente', venta });
  } catch (error) {
    const status = error.message.includes('ya está') ? 409 : 500;
    res.status(status).json({ error: error.message });
  }
}

export default { listar, obtenerUno, crear, cancelar };