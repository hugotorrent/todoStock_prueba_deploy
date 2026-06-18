// ─── controllers/resumen.controller.js ───────────────────────────────────────
// REFACTORIZADO: calcularResumen() devuelve datos puros
// obtenerResumen() es el endpoint Express para /api/resumen

import ProveedorModel from '../models/proveedor.model.js';
import ProductoModel  from '../models/producto.model.js';
import ClienteModel   from '../models/cliente.model.js';
import VentaModel     from '../models/venta.model.js';

async function calcularResumen() {
  const [proveedores, productos, clientes, ventas] = await Promise.all([
    ProveedorModel.obtenerTodos(),
    ProductoModel.obtenerTodos(),
    ClienteModel.obtenerTodos(),
    VentaModel.obtenerTodos(),
  ]);

  const proveedoresActivos   = proveedores.filter(p => p.activo).length;
  const proveedoresInactivos = proveedores.filter(p => !p.activo).length;
  const productosActivos       = productos.filter(p => p.activo);
  const productosSinStock      = productosActivos.filter(p => p.stock <= 0);
  const productosEnStockMinimo = productosActivos.filter(p => p.stock > 0 && p.stock <= p.stockMinimo);
  const productosOk            = productosActivos.filter(p => p.stock > p.stockMinimo);
  const clientesActivos        = clientes.filter(c => c.activo);
  const clientesConDeudaAlta   = clientesActivos.filter(c => c.limiteCrediticio > 0 && (c.deudaActual / c.limiteCrediticio) >= 0.8);
  const deudaTotalCartera      = clientesActivos.reduce((s, c) => s + c.deudaActual, 0);
  const hoy         = new Date().toISOString().split('T')[0];
  const ventasHoy   = ventas.filter(v => v.createdAt?.toISOString().startsWith(hoy));
  const confirmadas = ventas.filter(v => v.estado === 'confirmada');
  const canceladas  = ventas.filter(v => v.estado === 'cancelada');
  const totalVentas = confirmadas.reduce((s, v) => s + v.total, 0);
  const totalHoy    = ventasHoy.filter(v => v.estado === 'confirmada').reduce((s, v) => s + v.total, 0);

  const alertas = [];
  productosSinStock.forEach(p => alertas.push({ tipo: 'SIN_STOCK', urgencia: 'ALTA', mensaje: `"${p.nombre}" sin stock. Iniciar compra de inmediato.` }));
  productosEnStockMinimo.forEach(p => alertas.push({ tipo: 'STOCK_MINIMO', urgencia: 'MEDIA', mensaje: `"${p.nombre}" en stock mínimo (${p.stock} unidades).` }));
  clientesConDeudaAlta.forEach(c => {
    const pct = Math.round((c.deudaActual / c.limiteCrediticio) * 100);
    alertas.push({ tipo: 'DEUDA_ALTA', urgencia: 'MEDIA', mensaje: `"${c.razonSocial}" usa el ${pct}% de su crédito.` });
  });

  return {
    generadoEn:  new Date().toISOString(),
    proveedores: { total: proveedores.length, activos: proveedoresActivos, inactivos: proveedoresInactivos },
    productos:   { total: productos.length, activos: productosActivos.length, sinStock: productosSinStock.length, enStockMinimo: productosEnStockMinimo.length, estadoOk: productosOk.length },
    clientes:    { total: clientes.length, activos: clientesActivos.length, conDeudaAlta: clientesConDeudaAlta.length, deudaTotalCartera },
    ventas:      { total: ventas.length, confirmadas: confirmadas.length, canceladas: canceladas.length, hoy: ventasHoy.length, totalVentas: Math.round(totalVentas * 100) / 100, totalHoy: Math.round(totalHoy * 100) / 100 },
    alertas:     { total: alertas.length, items: alertas },
  };
}

async function obtenerResumen(req, res) {
  try {
    res.status(200).json(await calcularResumen());
  } catch (error) {
    res.status(500).json({ error: 'Error al generar resumen', detalle: error.message });
  }
}

export default { calcularResumen, obtenerResumen };
