// ─── models/pedido.model.js ───────────────────────────────────────────────────
// Módulo central. Orquesta Cliente + Producto al crear y cancelar pedidos.

import Pedido from '../schemas/pedido.schema.js';
import clienteModel from './cliente.model.js';
import productoModel from './producto.model.js';

// ── Validación cruzada (lógica sin cambios) ───────────────────────────────────
async function validarPedido(clienteId, items, modalidad) {
  // 1. Cliente existe y está activo
  const cliente = await clienteModel.obtenerPorId(clienteId);
  if (!cliente)        throw new Error(`El cliente con id "${clienteId}" no existe`);
  if (!cliente.activo) throw new Error(`El cliente "${cliente.razonSocial}" está inactivo`);

  if (!items || items.length === 0) throw new Error('El pedido debe tener al menos un producto');

  // 2. Validar cada producto
  let totalCalculado = 0;
  const itemsValidados = [];

  for (const item of items) {
    if (!item.productoId || !item.cantidad || item.cantidad <= 0) {
      throw new Error('Cada item debe tener productoId y una cantidad mayor a 0');
    }

    const producto = await productoModel.obtenerPorId(item.productoId);
    if (!producto)        throw new Error(`El producto con id "${item.productoId}" no existe`);
    if (!producto.activo) throw new Error(`El producto "${producto.nombre}" está inactivo`);
    if (producto.stock < item.cantidad) {
      throw new Error(`Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock}, solicitado: ${item.cantidad}`);
    }

    const precioUnitario = item.precioUnitario || producto.precio;
    totalCalculado += precioUnitario * item.cantidad;

    itemsValidados.push({ productoId: item.productoId, cantidad: item.cantidad, precioUnitario });
  }

  // 3. Control crediticio si es cuenta corriente
  if (modalidad === 'cuenta_corriente') {
    const resultadoCredito = clienteModel.evaluarCredito(cliente, totalCalculado);
    if (!resultadoCredito.puedeComprar) {
      throw new Error(`Crédito insuficiente. ${resultadoCredito.mensaje}`);
    }
  }

  return { cliente, itemsValidados, totalCalculado };
}

// ── CRUD ──────────────────────────────────────────────────────────────────────
async function obtenerTodos() {
  // populate() trae el nombre del cliente y el nombre de cada producto
  // reemplazando los ObjectIds con los documentos reales
  return await Pedido.find()
    .populate('clienteId', 'razonSocial')
    .populate('items.productoId', 'nombre');
}

async function obtenerPorId(id) {
  try {
    return await Pedido.findById(id)
      .populate('clienteId', 'razonSocial')
      .populate('items.productoId', 'nombre');
  } catch {
    return null;
  }
}

async function crear(datos) {
  const { clienteId, items, modalidad } = datos;

  const { cliente, itemsValidados, totalCalculado } = await validarPedido(clienteId, items, modalidad);

  // Descontar stock de cada producto
  const alertasStock = [];
  for (const item of itemsValidados) {
    const productoActualizado = await productoModel.descontarStock(item.productoId, item.cantidad);
    if (productoActualizado.alertaStock) {
      alertasStock.push(productoActualizado.alertaStock);
    }
  }

  // Registrar deuda si es cuenta corriente
  if (modalidad === 'cuenta_corriente') {
    await clienteModel.registrarDeuda(clienteId, totalCalculado);
  }

  const nuevoPedido = new Pedido({
    clienteId,
    modalidad,
    estado: 'confirmado',
    items:  itemsValidados,
    total:  Math.round(totalCalculado * 100) / 100,
  });

  const guardado = await nuevoPedido.save();
  return {
    pedido: { ...guardado.toObject(), nombreCliente: cliente.razonSocial },
    alertasStock,
  };
}

async function cancelar(id) {
  const pedido = await Pedido.findById(id);
  if (!pedido) return null;
  if (pedido.estado === 'cancelado') throw new Error(`El pedido "${id}" ya está cancelado`);

  // Devolver stock a cada producto
  for (const item of pedido.items) {
    const producto = await productoModel.obtenerPorId(item.productoId);
    if (producto) {
      await productoModel.actualizar(item.productoId, { stock: producto.stock + item.cantidad });
    }
  }

  // Revertir deuda si era cuenta corriente
  if (pedido.modalidad === 'cuenta_corriente') {
    await clienteModel.saldarDeuda(pedido.clienteId, pedido.total);
  }

  pedido.estado = 'cancelado';
  return await pedido.save();
}

export default { obtenerTodos, obtenerPorId, crear, cancelar };