// // ─── controllers/ventas.controller.js ────────────────────────────────────────
// // SEGUNDA ENTREGA — Reescrito respecto a la primera entrega.
// //
// // PRIMERA ENTREGA:
// //   - Funciones síncronas (sin async/await)
// //   - Toda la lógica de negocio estaba aquí (verificar stock, calcular total)
// //   - Usaba Venta.getAll(), Cliente.getById(), Producto.getAll() del JSON
// //
// // SEGUNDA ENTREGA:
// //   - Funciones async/await
// //   - La lógica de negocio se movió al model (venta.model.js)
// //   - El controller solo valida el formato del body y arma la respuesta HTTP

// import ventaModel from '../models/venta.model.js';

// // GET /api/ventas — listar todas las ventas
// // CAMBIO: era síncrono, ahora es async. populate() trae nombre del cliente y productos.
// async function listar(req, res) {
//   try {
//     res.status(200).json(await ventaModel.obtenerTodos());
//   } catch (error) {
//     res.status(500).json({ error: 'Error al obtener ventas', detalle: error.message });
//   }
// }

// // GET /api/ventas/:id — obtener una venta por id
// // NUEVO — en la primera entrega no existía este endpoint.
// async function obtenerUno(req, res) {
//   try {
//     const venta = await ventaModel.obtenerPorId(req.params.id);
//     if (!venta)
//       return res.status(404).json({ error: `Venta "${req.params.id}" no encontrada` });
//     res.status(200).json(venta);
//   } catch (error) {
//     res.status(500).json({ error: 'Error al obtener venta', detalle: error.message });
//   }
// }

// // POST /api/ventas — crear una nueva venta
// // CAMBIO: la lógica de validar stock, calcular total y crear la venta
// // estaba toda en este controller en la primera entrega.
// // Ahora el controller solo valida el formato y delega al model.
// async function crear(req, res) {
//   try {
//     const { clienteId, items, modalidad } = req.body;

//     // Validación de formato — responsabilidad del controller
//     if (!clienteId || !items || !modalidad) {
//       return res.status(400).json({
//         error: 'Faltan campos obligatorios',
//         requeridos: ['clienteId', 'items', 'modalidad'],
//         ejemplo: {
//           clienteId: '<id de MongoDB>',
//           modalidad: 'contado',
//           items: [{ productoId: '<id de MongoDB>', cantidad: 5 }]
//         }
//       });
//     }

//     if (!Array.isArray(items))
//       return res.status(400).json({ error: '"items" debe ser un array' });

//     // El model se encarga de validar existencia de cliente, stock,
//     // crédito y de ejecutar los efectos (descontar stock, registrar deuda)
//     const resultado = await ventaModel.crear(req.body);

//     // 201 Created: indica que se creó un nuevo recurso
//     res.status(201).json(resultado);

//   } catch (error) {
//     // El model lanza errores con mensajes específicos para cada caso de negocio
//     const erroresNegocio = [
//       'no existe', 'inactivo', 'Stock insuficiente',
//       'Crédito insuficiente', 'inválida', 'al menos un producto'
//     ];
//     // 422 Unprocessable Entity: el formato está bien pero la lógica lo rechaza
//     if (erroresNegocio.some(e => error.message.includes(e)))
//       return res.status(422).json({ error: error.message });

//     res.status(500).json({ error: 'Error al crear venta', detalle: error.message });
//   }
// }

// // DELETE /api/ventas/:id — cancelar una venta
// // NUEVO — en la primera entrega no existía cancelar.
// // Al cancelar: revierte el stock de cada producto y la deuda del cliente si aplica.
// async function cancelar(req, res) {
//   try {
//     const cancelada = await ventaModel.cancelar(req.params.id);
//     if (!cancelada)
//       return res.status(404).json({ error: `Venta "${req.params.id}" no encontrada` });

//     res.status(200).json({
//       mensaje: `Venta "${cancelada._id}" cancelada. Stock y deuda revertidos correctamente.`,
//       venta: cancelada
//     });
//   } catch (error) {
//     if (error.message.includes('ya está cancelada'))
//       return res.status(409).json({ error: error.message });
//     res.status(500).json({ error: 'Error al cancelar venta', detalle: error.message });
//   }
// }

// export default { listar, obtenerUno, crear, cancelar };

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
async function obtener(req, res) {
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

export default { listar, obtener, crear, cancelar };