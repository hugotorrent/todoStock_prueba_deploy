import { state } from './state.js';

export function renderTabla(datos, seccion) {
  const contenido = document.getElementById('contenido');

  if (!datos.length) {
    contenido.innerHTML = `<div class="tabla-wrap"><p class="sin-datos">No hay datos para mostrar.</p></div>`;
    return;
  }

  const renders = {
    ventas: renderVentas,
    productos: renderProductos,
    clientes: renderClientes,
    proveedores: renderProveedores,
  };

  contenido.innerHTML = `<div class="tabla-wrap">${renders[seccion](datos)}</div>`;
}

export function attachTablaActions(seccion, callbacks = {}) {
  if (seccion !== 'ventas' || !callbacks.onCancelarVenta) return;

  document.querySelectorAll('.btn-cancelar-venta').forEach((button) => {
    button.addEventListener('click', () => callbacks.onCancelarVenta(button.dataset.id));
  });
}

function renderVentas(ventas) {
  const filas = ventas
    .map((venta) => {
      const cliente = venta.clienteId ? venta.clienteId.razonSocial : '—';
      const fecha = new Date(venta.createdAt).toLocaleDateString('es-AR');
      const estadoCls = venta.estado === 'confirmada' ? 'badge-ok' : 'badge-danger';
      const accion = state.rolActual === 'admin'
        ? (venta.estado === 'confirmada'
            ? `<button type="button" class="btn-tabla danger btn-cancelar-venta" data-id="${venta._id}">Cancelar</button>`
            : '<span style="color:#d1d5db">—</span>')
        : '';

      return `<tr>
        <td>${cliente}</td>
        <td>${venta.modalidad}</td>
        <td>$${venta.total.toLocaleString()}</td>
        <td><span class="badge ${estadoCls}">${venta.estado}</span></td>
        <td>${venta.items.length} ítem(s)</td>
        <td>${fecha}</td>
        ${state.rolActual === 'admin' ? `<td>${accion}</td>` : ''}
      </tr>`;
    })
    .join('');

  const colAccion = state.rolActual === 'admin' ? '<th>Acciones</th>' : '';

  return `<table>
    <thead><tr>
      <th>Cliente</th><th>Modalidad</th><th>Total</th><th>Estado</th><th>Ítems</th><th>Fecha</th>${colAccion}
    </tr></thead>
    <tbody>${filas}</tbody>
  </table>`;
}

function renderProductos(productos) {
  const filas = productos
    .map((producto) => {
      const proveedor = producto.proveedorId ? producto.proveedorId.razonSocial : '—';
      let stockBadge;

      if (producto.stock <= 0) {
        stockBadge = `<span class="badge badge-danger">Sin stock</span>`;
      } else if (producto.stock <= producto.stockMinimo) {
        stockBadge = `<span class="badge badge-warn">${producto.stock} — mínimo</span>`;
      } else {
        stockBadge = `<span class="badge badge-ok">${producto.stock}</span>`;
      }

      const estadoBadge = producto.activo
        ? '<span class="badge badge-ok">Activo</span>'
        : '<span class="badge badge-gray">Inactivo</span>';

      return `<tr>
        <td>${producto.nombre}</td>
        <td>$${producto.precio.toLocaleString()}</td>
        <td>${stockBadge}</td>
        <td>${producto.stockMinimo}</td>
        <td>${proveedor}</td>
        <td>${estadoBadge}</td>
      </tr>`;
    })
    .join('');

  return `<table>
    <thead><tr>
      <th>Nombre</th><th>Precio</th><th>Stock</th><th>Stock mín.</th><th>Proveedor</th><th>Estado</th>
    </tr></thead>
    <tbody>${filas}</tbody>
  </table>`;
}

function renderClientes(clientes) {
  const filas = clientes
    .map((cliente) => {
      const porcentaje = cliente.limiteCrediticio > 0
        ? Math.round((cliente.deudaActual / cliente.limiteCrediticio) * 100)
        : 0;
      const deudaCls = porcentaje >= 80 ? 'badge-danger' : 'badge-ok';
      const estadoBadge = cliente.activo
        ? '<span class="badge badge-ok">Activo</span>'
        : '<span class="badge badge-gray">Inactivo</span>';

      return `<tr>
        <td>${cliente.razonSocial}</td>
        <td>${cliente.cuit}</td>
        <td>${cliente.condicionIva}</td>
        <td>$${cliente.limiteCrediticio.toLocaleString()}</td>
        <td><span class="badge ${deudaCls}">$${cliente.deudaActual.toLocaleString()} (${porcentaje}%)</span></td>
        <td>${estadoBadge}</td>
      </tr>`;
    })
    .join('');

  return `<table>
    <thead><tr>
      <th>Razón Social</th><th>CUIT</th><th>Cond. IVA</th><th>Límite CC</th><th>Deuda</th><th>Estado</th>
    </tr></thead>
    <tbody>${filas}</tbody>
  </table>`;
}

function renderProveedores(proveedores) {
  const filas = proveedores
    .map((proveedor) => {
      const estadoBadge = proveedor.activo
        ? '<span class="badge badge-ok">Activo</span>'
        : '<span class="badge badge-gray">Inactivo</span>';

      return `<tr>
        <td>${proveedor.razonSocial}</td>
        <td>${proveedor.cuit}</td>
        <td>${proveedor.email || '—'}</td>
        <td>${proveedor.telefono || '—'}</td>
        <td>${estadoBadge}</td>
      </tr>`;
    })
    .join('');

  return `<table>
    <thead><tr>
      <th>Razón Social</th><th>CUIT</th><th>Email</th><th>Teléfono</th><th>Estado</th>
    </tr></thead>
    <tbody>${filas}</tbody>
  </table>`;
}
