// ─── models/venta.model.js ────────────────────────────────────────────────────
// SEGUNDA ENTREGA — Reescrito completamente respecto a la primera entrega.
//
// PRIMERA ENTREGA usaba:
//   - Clase Venta con constructor y métodos estáticos
//   - fs.readFileSync / fs.writeFileSync sobre ventas.json
//   - Operaciones síncronas
//
// SEGUNDA ENTREGA usa:
//   - Funciones async/await
//   - Mongoose para leer y escribir en MongoDB
//   - populate() para traer datos relacionados de otras colecciones

import Venta from '../schemas/venta.schema.js';
import clienteModel from './cliente.model.js';
import productoModel from './producto.model.js';

// ─── Validación cruzada ───────────────────────────────────────────────────────
// NUEVO — En la primera entrega la validación estaba dentro del controller.
// Ahora la centralizamos en el model: si algo falla, lanzamos un error
// y ningún dato se modifica. El controller solo captura ese error.

async function validarVenta(clienteId, items, modalidad) {
  // 1. Verificar que el cliente exista y esté activo
  const cliente = await clienteModel.obtenerPorId(clienteId);
  if (!cliente)
    throw new Error(`El cliente con id "${clienteId}" no existe`);
  if (!cliente.activo)
    throw new Error(`El cliente "${cliente.razonSocial}" está inactivo`);

  if (!items || items.length === 0)
    throw new Error('La venta debe tener al menos un producto');

  let totalCalculado = 0;
  const itemsValidados = [];

  // 2. Validar cada producto del pedido
  for (const item of items) {
    if (!item.productoId || !item.cantidad || item.cantidad <= 0)
      throw new Error('Cada item debe tener productoId y cantidad mayor a 0');

    // INTERACCIÓN ENTRE MÓDULOS: consultamos el model de Producto
    const producto = await productoModel.obtenerPorId(item.productoId);
    if (!producto)
      throw new Error(`El producto con id "${item.productoId}" no existe`);
    if (!producto.activo)
      throw new Error(`El producto "${producto.nombre}" está inactivo`);
    if (producto.stock < item.cantidad)
      throw new Error(
        `Stock insuficiente para "${producto.nombre}". ` +
        `Disponible: ${producto.stock}, solicitado: ${item.cantidad}`
      );

    // El precio se registra al momento de la venta no el precio actual
    const precioUnitario = item.precioUnitario || producto.precio;
    totalCalculado += precioUnitario * item.cantidad;
    itemsValidados.push({ productoId: item.productoId, cantidad: item.cantidad, precioUnitario });
  }

  // 3. Control crediticio — solo para cuenta corriente
  // INTERACCIÓN ENTRE MODULOS: consultamos evaluarCredito del model de Cliente
  if (modalidad === 'cuenta_corriente') {
    const credito = clienteModel.evaluarCredito(cliente, totalCalculado);
    if (!credito.puedeComprar)
      throw new Error(`Crédito insuficiente. ${credito.mensaje}`);
  }

  return { cliente, itemsValidados, totalCalculado };
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

async function obtenerTodos() {
  // populate() reemplaza los ObjectIds con los documentos reales
  // Es el equivalente a un JOIN en bases de datos relacionales
  return await Venta.find()
    .populate('clienteId', 'razonSocial')
    .populate('items.productoId', 'nombre');
}

async function obtenerPorId(id) {
  try {
    return await Venta.findById(id)
      .populate('clienteId', 'razonSocial')
      .populate('items.productoId', 'nombre');
  } catch {
    return null; // id con formato inválido de MongoDB
  }
}

async function crear(datos) {
  const { clienteId, items, modalidad } = datos;

  // Todas las validaciones primero — si algo falla no se modifica nada
  const { cliente, itemsValidados, totalCalculado } =
    await validarVenta(clienteId, items, modalidad);

  // Solo después de validar, ejecutamos los efectos:

  // Descontar stock de cada producto
  // interaccion entre modulos: llamamos a descontarStock del model de Producto
  const alertasStock = [];
  for (const item of itemsValidados) {
    const productoActualizado =
      await productoModel.descontarStock(item.productoId, item.cantidad);
    // Si el stock bajo al minimo, guardamos la alerta para informar en la respuesta
    if (productoActualizado.alertaStock)
      alertasStock.push(productoActualizado.alertaStock);
  }

  // Si es cuenta corriente, registrar la deuda en el cliente
  // interaccion entre modulos: llamamos a registrarDeuda del model de Cliente
  if (modalidad === 'cuenta_corriente')
    await clienteModel.registrarDeuda(clienteId, totalCalculado);

  // Crear y guardar el documento en MongoDB
  const nuevaVenta = new Venta({
    clienteId,
    modalidad,
    estado: 'confirmada',
    items:  itemsValidados,
    total:  Math.round(totalCalculado * 100) / 100,
  });

  const guardada = await nuevaVenta.save();
  return {
    venta: { ...guardada.toObject(), nombreCliente: cliente.razonSocial },
    alertasStock, // array vacío si no hay alertas
  };
}

// NUEVO — En la primera entrega no existía la posibilidad de cancelar una venta.
// Al cancelar: devolvemos el stock a cada producto y reducimos la deuda si corresponde.
async function cancelar(id) {
  const venta = await Venta.findById(id);
  if (!venta) return null;
  if (venta.estado === 'cancelada')
    throw new Error(`La venta "${id}" ya está cancelada`);

  // Devolver stock a cada producto
  for (const item of venta.items) {
    const producto = await productoModel.obtenerPorId(item.productoId);
    if (producto)
      await productoModel.actualizar(item.productoId, {
        stock: producto.stock + item.cantidad
      });
  }

  // Revertir deuda si era cuenta corriente
  if (venta.modalidad === 'cuenta_corriente')
    await clienteModel.saldarDeuda(venta.clienteId, venta.total);

  venta.estado = 'cancelada';
  return await venta.save();
}

export default { obtenerTodos, obtenerPorId, crear, cancelar };