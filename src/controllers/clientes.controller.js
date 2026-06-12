// ─── controllers/clientes.controller.js ───────────────────────────────────────
// SEGUNDA ENTREGA — Reescrito respecto a la primera entrega.
//
// PRIMERA ENTREGA:
//   - Funciones síncronas (sin async/await)
//   - Usaba Cliente.getAll(), Cliente.getById(), Cliente.crear() del JSON
//   - eliminarCliente verificaba ventas para integridad referencial
//
// SEGUNDA ENTREGA:
//   - Funciones async/await con Mongoose
//   - Baja lógica (desactivar) en lugar de eliminación física
//   - Nuevos endpoints: consultarCredito y registrarPago

import clienteModel from '../models/cliente.model.js';

// GET /api/clientes
// CAMBIO: era síncrono, ahora es async
async function listar(req, res) {
  try {
    res.status(200).json(await clienteModel.obtenerTodos());
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener clientes', detalle: error.message });
  }
}

// GET /api/clientes/:id
// CAMBIO: era síncrono con Cliente.getById(), ahora es async con Mongoose
async function obtenerUno(req, res) {
  try {
    const cliente = await clienteModel.obtenerPorId(req.params.id);
    if (!cliente)
      return res.status(404).json({ error: `Cliente "${req.params.id}" no encontrado` });
    res.status(200).json(cliente);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener cliente', detalle: error.message });
  }
}

// POST /api/clientes
// CAMBIO: era síncrono, ahora es async
async function crear(req, res) {
  try {
    const { razonSocial, cuit, condicionIva } = req.body;
    if (!razonSocial || !cuit || !condicionIva) {
      return res.status(400).json({
        error: 'Faltan campos obligatorios',
        requeridos: ['razonSocial', 'cuit', 'condicionIva']
      });
    }
    const nuevo = await clienteModel.crear(req.body);
    res.status(201).json(nuevo);
  } catch (error) {
    if (error.message.includes('Ya existe'))
      return res.status(409).json({ error: error.message });
    if (error.message.includes('inválida'))
      return res.status(400).json({ error: error.message });
    res.status(500).json({ error: 'Error al crear cliente', detalle: error.message });
  }
}

// PUT /api/clientes/:id
// CAMBIO: era síncrono con Cliente.actualizar(), ahora es async con Mongoose
async function actualizar(req, res) {
  try {
    const actualizado = await clienteModel.actualizar(req.params.id, req.body);
    if (!actualizado)
      return res.status(404).json({ error: `Cliente "${req.params.id}" no encontrado` });
    res.status(200).json(actualizado);
  } catch (error) {
    if (error.message.includes('Ya existe'))
      return res.status(409).json({ error: error.message });
    if (error.message.includes('directamente'))
      return res.status(400).json({ error: error.message });
    res.status(500).json({ error: 'Error al actualizar cliente', detalle: error.message });
  }
}

// DELETE /api/clientes/:id
// CAMBIO IMPORTANTE: en la primera entrega eliminaba físicamente el documento.
// Ahora hace una baja lógica (activo: false) y bloquea si tiene deuda pendiente.
// Esto evita romper referencias en ventas históricas.
async function desactivar(req, res) {
  try {
    const desactivado = await clienteModel.desactivar(req.params.id);
    if (!desactivado)
      return res.status(404).json({ error: `Cliente "${req.params.id}" no encontrado` });
    res.status(200).json({
      mensaje: `Cliente "${desactivado.razonSocial}" desactivado correctamente`,
      cliente: desactivado
    });
  } catch (error) {
    // El model bloquea la desactivación si hay deuda pendiente
    if (error.message.includes('deuda pendiente'))
      return res.status(409).json({ error: error.message });
    res.status(500).json({ error: 'Error al desactivar cliente', detalle: error.message });
  }
}

// GET /api/clientes/:id/credito?monto=N
// NUEVO — permite consultar si un cliente puede comprar un monto antes de crear la venta
async function consultarCredito(req, res) {
  try {
    const cliente = await clienteModel.obtenerPorId(req.params.id);
    if (!cliente)
      return res.status(404).json({ error: `Cliente "${req.params.id}" no encontrado` });

    const monto     = parseFloat(req.query.monto) || 0;
    const resultado = clienteModel.evaluarCredito(cliente, monto);
    res.status(200).json({
      cliente: { id: cliente._id, razonSocial: cliente.razonSocial },
      credito: resultado
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar crédito', detalle: error.message });
  }
}

// POST /api/clientes/:id/pagos
// NUEVO — registra un pago parcial o total de la deuda en cuenta corriente
async function registrarPago(req, res) {
  try {
    const { monto } = req.body;
    if (!monto || isNaN(monto) || monto <= 0)
      return res.status(400).json({ error: 'El monto del pago debe ser un número positivo' });

    const cliente = await clienteModel.saldarDeuda(req.params.id, monto);
    res.status(200).json({ mensaje: `Pago de $${monto} registrado correctamente`, cliente });
  } catch (error) {
    if (error.message.includes('supera la deuda'))
      return res.status(400).json({ error: error.message });
    res.status(500).json({ error: 'Error al registrar pago', detalle: error.message });
  }
}

export default {
  listar, obtenerUno, crear, actualizar, desactivar,
  consultarCredito, registrarPago
};