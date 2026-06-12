// ─── models/producto.model.js ─────────────────────────────────────────────────
import Producto from '../schemas/producto.schema.js';
import Proveedor from '../schemas/proveedor.schema.js';

// ── Lógica de alertas (sin cambios) ──────────────────────────────────────────
function evaluarAlertaStock(producto) {
  if (producto.stock <= 0) {
    return { tipo: 'SIN_STOCK', mensaje: `🟡 URGENTE: "${producto.nombre}" sin stock. Iniciar compra.` };
  }
  if (producto.stock <= producto.stockMinimo) {
    return { tipo: 'STOCK_MINIMO', mensaje: `🟡 ALERTA: "${producto.nombre}" en stock mínimo (${producto.stock} unidades).` };
  }
  return null;
}

// ── CRUD ──────────────────────────────────────────────────────────────────────
async function obtenerTodos() {
  // populate() reemplaza el ObjectId de proveedorId con el documento real
  // Es el equivalente a un JOIN en SQL
  const productos = await Producto.find().populate('proveedorId', 'razonSocial activo');
  return productos.map(p => ({ ...p.toObject(), alertaStock: evaluarAlertaStock(p) }));
}

async function obtenerPorId(id) {
  try {
    const p = await Producto.findById(id).populate('proveedorId', 'razonSocial activo');
    if (!p) return null;
    return { ...p.toObject(), alertaStock: evaluarAlertaStock(p) };
  } catch {
    return null;
  }
}

async function crear(datos) {
  // Validar que el proveedor exista y esté activo
  const proveedor = await Proveedor.findById(datos.proveedorId);
  if (!proveedor)        throw new Error(`El proveedor con id "${datos.proveedorId}" no existe`);
  if (!proveedor.activo) throw new Error(`El proveedor "${proveedor.razonSocial}" está inactivo`);

  const stockMinimo = datos.stockMinimo || 0;
  const stockMaximo = datos.stockMaximo || stockMinimo * 2;

  const nuevo = new Producto({
    nombre:      datos.nombre,
    descripcion: datos.descripcion || '',
    precio:      datos.precio,
    stock:       datos.stock || 0,
    stockMinimo,
    stockMaximo,
    proveedorId: datos.proveedorId,
  });

  const guardado = await nuevo.save();
  return { ...guardado.toObject(), alertaStock: evaluarAlertaStock(guardado) };
}

async function actualizar(id, datos) {
  // Si cambia el proveedor, validar el nuevo
  if (datos.proveedorId) {
    const proveedor = await Proveedor.findById(datos.proveedorId);
    if (!proveedor)        throw new Error(`El proveedor con id "${datos.proveedorId}" no existe`);
    if (!proveedor.activo) throw new Error(`El proveedor "${proveedor.razonSocial}" está inactivo`);
  }

  const actualizado = await Producto.findByIdAndUpdate(id, datos, { new: true, runValidators: true });
  if (!actualizado) return null;
  return { ...actualizado.toObject(), alertaStock: evaluarAlertaStock(actualizado) };
}

async function desactivar(id) {
  return await Producto.findByIdAndUpdate(id, { activo: false }, { new: true });
}

// Usada por pedido.model.js al confirmar un pedido
async function descontarStock(productoId, cantidad) {
  const producto = await Producto.findById(productoId);
  if (!producto)        throw new Error(`Producto "${productoId}" no encontrado`);
  if (!producto.activo) throw new Error(`El producto "${producto.nombre}" está inactivo`);
  if (producto.stock < cantidad) {
    throw new Error(`Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock}, solicitado: ${cantidad}`);
  }

  producto.stock -= cantidad;
  const guardado = await producto.save();
  return { ...guardado.toObject(), alertaStock: evaluarAlertaStock(guardado) };
}

export default { obtenerTodos, obtenerPorId, crear, actualizar, desactivar, descontarStock };