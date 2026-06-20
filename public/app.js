// ─── app.js (cliente) ─────────────────────────────────────────────────────────
// Panel SPA vanilla — consume la API de TodoStock sin frameworks.
// Toda la lógica de renderizado corre en el navegador con fetch + innerHTML.

// ── Estado global ─────────────────────────────────────────────────────────────
let rolActual    = null;
let seccionActual = 'ventas';
let datosActuales = [];  // cache de los datos de la sección activa
let productos    = [];   // cache para el modal de nueva venta
let clientes     = [];   // cache para el modal de nueva venta

// ── Inicialización ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await obtenerRol();
  configurarNav();
  cargarSeccion('ventas');
});

// ── Obtener rol desde la API ──────────────────────────────────────────────────
async function obtenerRol() {
  try {
    const res = await fetch('/api/me');
    if (res.status === 401) { window.location.href = '/login'; return; }
    const data = await res.json();
    rolActual = data.rol;

    // Mostrar badge del rol
    const badge = document.getElementById('rol-badge');
    badge.textContent = rolActual === 'admin' ? '👑 Administrador' : '👤 Empleado';
    badge.className   = `rol-badge ${rolActual}`;

    // Ocultar secciones restringidas para empleado
    if (rolActual !== 'admin') {
      document.querySelectorAll('.admin-only').forEach(el => el.classList.add('bloqueado'));
    }
  } catch (e) {
    window.location.href = '/login';
  }
}

// ── Configurar navegación ─────────────────────────────────────────────────────
function configurarNav() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const seccion = item.dataset.seccion;
      if (item.classList.contains('bloqueado')) return;
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      cargarSeccion(seccion);
    });
  });
}

// ── Cargar sección ────────────────────────────────────────────────────────────
async function cargarSeccion(seccion) {
  seccionActual = seccion;
  document.getElementById('topbar-titulo').textContent = titulos[seccion] || seccion;

  const contenido    = document.getElementById('contenido');
  const btnNuevo     = document.getElementById('btn-nuevo');
  const barraBusqueda= document.getElementById('barra-busqueda');
  const filtroEstado = document.getElementById('filtro-estado');

  contenido.innerHTML = '<div class="spinner">Cargando...</div>';
  btnNuevo.style.display     = 'none';
  barraBusqueda.style.display= 'none';
  filtroEstado.style.display = 'none';

  if (seccion === 'resumen') { await cargarResumen(); return; }

  try {
    const res  = await fetch(`/api/${seccion}`);
    const data = await res.json();
    datosActuales = Array.isArray(data) ? data : (data.registros || []);

    barraBusqueda.style.display = 'flex';

    if (['productos','proveedores','clientes'].includes(seccion)) {
      filtroEstado.style.display = 'block';
    }

    if (seccion === 'ventas' && rolActual === 'admin') {
      btnNuevo.style.display = 'block';
      btnNuevo.onclick = abrirModalVenta;
    }
    if (seccion === 'productos' && rolActual === 'admin') {
      btnNuevo.style.display = 'block';
      btnNuevo.onclick = () => mostrarToast('Usá Postman para crear productos con proveedor vinculado', 'warn');
    }

    renderTabla(datosActuales, seccion);
  } catch (e) {
    contenido.innerHTML = `<div class="sin-datos">❌ Error al cargar ${seccion}: ${e.message}</div>`;
  }
}

// ── Títulos ───────────────────────────────────────────────────────────────────
const titulos = {
  ventas: 'Ventas', productos: 'Productos',
  clientes: 'Clientes', proveedores: 'Proveedores', resumen: 'Dashboard'
};

// ── Filtrar en tiempo real ────────────────────────────────────────────────────
function filtrar() {
  const texto  = document.getElementById('input-busqueda').value.toLowerCase();
  const estado = document.getElementById('filtro-estado').value;

  const filtrados = datosActuales.filter(item => {
    const nombre = (item.nombre || item.razonSocial || '').toLowerCase();
    const coincideTexto  = nombre.includes(texto);
    const coincideEstado = !estado ||
      (estado === 'activo'   && item.activo) ||
      (estado === 'inactivo' && !item.activo);
    return coincideTexto && coincideEstado;
  });

  renderTabla(filtrados, seccionActual);
}

// ── Render de tabla según sección ─────────────────────────────────────────────
function renderTabla(datos, seccion) {
  const contenido = document.getElementById('contenido');
  if (!datos.length) {
    contenido.innerHTML = `<div class="tabla-wrap"><p class="sin-datos">No hay datos para mostrar.</p></div>`;
    return;
  }

  const renders = {
    ventas:      renderVentas,
    productos:   renderProductos,
    clientes:    renderClientes,
    proveedores: renderProveedores,
    auditoria:   renderAuditoria,
  };

  contenido.innerHTML = `<div class="tabla-wrap">${(renders[seccion] || (() => ''))(datos)}</div>`;
}

// ── Render Ventas ─────────────────────────────────────────────────────────────
function renderVentas(ventas) {
  const acciones = rolActual === 'admin'
    ? '<th>Acciones</th>' : '';
  const filas = ventas.map(v => {
    const cliente = v.clienteId?.razonSocial || '—';
    const fecha   = new Date(v.createdAt).toLocaleDateString('es-AR');
    const badgeCls= v.estado === 'confirmada' ? 'badge-ok' : 'badge-danger';
    const accion  = rolActual === 'admin' && v.estado === 'confirmada'
      ? `<button class="btn-tabla danger" onclick="cancelarVenta('${v._id}')">Cancelar</button>`
      : '<span style="color:#ccc">—</span>';
    return `<tr>
      <td>${cliente}</td>
      <td>${v.modalidad}</td>
      <td>$${v.total.toLocaleString()}</td>
      <td><span class="badge ${badgeCls}">${v.estado}</span></td>
      <td>${v.items.length} producto(s)</td>
      <td>${fecha}</td>
      ${rolActual === 'admin' ? `<td>${accion}</td>` : ''}
    </tr>`;
  }).join('');

  return `<table>
    <thead><tr>
      <th>Cliente</th><th>Modalidad</th><th>Total</th>
      <th>Estado</th><th>Items</th><th>Fecha</th>${acciones}
    </tr></thead>
    <tbody>${filas}</tbody>
  </table>`;
}

// ── Render Productos ──────────────────────────────────────────────────────────
function renderProductos(productos) {
  const filas = productos.map(p => {
    const prov  = p.proveedorId?.razonSocial || '—';
    let stockBadge;
    if (p.stock <= 0)              stockBadge = `<span class="badge badge-danger">SIN STOCK (${p.stock})</span>`;
    else if (p.stock <= p.stockMinimo) stockBadge = `<span class="badge badge-warn">⚠ ${p.stock}</span>`;
    else                           stockBadge = `<span class="badge badge-ok">✓ ${p.stock}</span>`;
    const estadoBadge = p.activo
      ? '<span class="badge badge-ok">Activo</span>'
      : '<span class="badge badge-gray">Inactivo</span>';
    return `<tr>
      <td>${p.nombre}</td>
      <td>$${p.precio.toLocaleString()}</td>
      <td>${stockBadge}</td>
      <td>${p.stockMinimo}</td>
      <td>${prov}</td>
      <td>${estadoBadge}</td>
    </tr>`;
  }).join('');

  return `<table>
    <thead><tr>
      <th>Nombre</th><th>Precio</th><th>Stock</th>
      <th>Stock Mín.</th><th>Proveedor</th><th>Estado</th>
    </tr></thead>
    <tbody>${filas}</tbody>
  </table>`;
}

// ── Render Clientes ───────────────────────────────────────────────────────────
function renderClientes(clientes) {
  const filas = clientes.map(c => {
    const pct = c.limiteCrediticio > 0
      ? Math.round((c.deudaActual / c.limiteCrediticio) * 100) : 0;
    const deudaBadge = pct >= 80
      ? `<span class="badge badge-danger">$${c.deudaActual.toLocaleString()} (${pct}%)</span>`
      : `<span class="badge badge-ok">$${c.deudaActual.toLocaleString()} (${pct}%)</span>`;
    const estadoBadge = c.activo
      ? '<span class="badge badge-ok">Activo</span>'
      : '<span class="badge badge-gray">Inactivo</span>';
    return `<tr>
      <td>${c.razonSocial}</td>
      <td>${c.cuit}</td>
      <td>${c.condicionIva}</td>
      <td>$${c.limiteCrediticio.toLocaleString()}</td>
      <td>${deudaBadge}</td>
      <td>${estadoBadge}</td>
    </tr>`;
  }).join('');

  return `<table>
    <thead><tr>
      <th>Razón Social</th><th>CUIT</th><th>Condición IVA</th>
      <th>Límite CC</th><th>Deuda actual</th><th>Estado</th>
    </tr></thead>
    <tbody>${filas}</tbody>
  </table>`;
}

// ── Render Proveedores ────────────────────────────────────────────────────────
function renderProveedores(proveedores) {
  const filas = proveedores.map(p => {
    const estadoBadge = p.activo
      ? '<span class="badge badge-ok">Activo</span>'
      : '<span class="badge badge-gray">Inactivo</span>';
    return `<tr>
      <td>${p.razonSocial}</td>
      <td>${p.cuit}</td>
      <td>${p.email || '—'}</td>
      <td>${p.telefono || '—'}</td>
      <td>${estadoBadge}</td>
    </tr>`;
  }).join('');

  return `<table>
    <thead><tr>
      <th>Razón Social</th><th>CUIT</th><th>Email</th>
      <th>Teléfono</th><th>Estado</th>
    </tr></thead>
    <tbody>${filas}</tbody>
  </table>`;
}

// ── Render Auditoría ──────────────────────────────────────────────────────────
function renderAuditoria(logs) {
  const filas = logs.map(l => {
    const statusCls = l.status >= 400 ? 'badge-danger' : 'badge-ok';
    const metodoMap = { POST:'badge-blue', PUT:'badge-warn', DELETE:'badge-danger' };
    return `<tr>
      <td>${new Date(l.fecha).toLocaleString('es-AR')}</td>
      <td><span class="badge ${metodoMap[l.metodo]||'badge-gray'}">${l.metodo}</span></td>
      <td style="font-family:monospace;font-size:.85em">${l.ruta}</td>
      <td><span class="badge ${statusCls}">${l.status}</span></td>
      <td>${l.duracion}</td>
    </tr>`;
  }).join('');

  return `<table>
    <thead><tr>
      <th>Fecha</th><th>Método</th><th>Ruta</th><th>Status</th><th>Duración</th>
    </tr></thead>
    <tbody>${filas || '<tr><td colspan="5" class="sin-datos">Sin registros aún.</td></tr>'}</tbody>
  </table>`;
}

// ── Dashboard resumen ─────────────────────────────────────────────────────────
async function cargarResumen() {
  try {
    const res  = await fetch('/api/resumen');
    const d    = await res.json();
    const c    = document.getElementById('contenido');

    c.innerHTML = `
      <div class="cards-grid">
        <div class="stat-card">
          <div class="val">${d.proveedores.activos}</div>
          <div class="lbl">Proveedores activos</div>
          <div class="sub">${d.proveedores.inactivos} inactivos</div>
        </div>
        <div class="stat-card">
          <div class="val">${d.productos.activos}</div>
          <div class="lbl">Productos activos</div>
          <div class="sub">${d.productos.sinStock} sin stock · ${d.productos.enStockMinimo} en mínimo</div>
        </div>
        <div class="stat-card">
          <div class="val">$${d.clientes.deudaTotalCartera.toLocaleString()}</div>
          <div class="lbl">Deuda total cartera</div>
          <div class="sub">${d.clientes.conDeudaAlta} clientes con deuda alta</div>
        </div>
        <div class="stat-card">
          <div class="val">${d.ventas.hoy}</div>
          <div class="lbl">Ventas hoy</div>
          <div class="sub">$${d.ventas.totalHoy.toLocaleString()} facturado</div>
        </div>
      </div>
      <div class="alertas-titulo">Alertas activas (${d.alertas.total})</div>
      ${d.alertas.total === 0
        ? '<div class="sin-alertas">✅ Sin alertas activas — sistema operando con normalidad.</div>'
        : d.alertas.items.map(a => `
          <div class="alerta-item alerta-${a.urgencia}">
            <span>${a.urgencia === 'ALTA' ? '🔴' : '🟡'}</span>
            <span><strong>${a.tipo}</strong> — ${a.mensaje}</span>
          </div>`).join('')
      }
    `;
  } catch (e) {
    document.getElementById('contenido').innerHTML =
      `<div class="sin-datos">❌ Error al cargar el resumen: ${e.message}</div>`;
  }
}

// ── Modal nueva venta ─────────────────────────────────────────────────────────
async function abrirModalVenta() {
  // Cargar clientes y productos para los selects
  [clientes, productos] = await Promise.all([
    fetch('/api/clientes').then(r => r.json()),
    fetch('/api/productos').then(r => r.json()),
  ]);

  const selCliente = document.getElementById('venta-cliente');
  selCliente.innerHTML = clientes
    .filter(c => c.activo)
    .map(c => `<option value="${c._id}">${c.razonSocial}</option>`)
    .join('');

  document.getElementById('venta-items').innerHTML = '';
  agregarItem();
  calcularTotal();

  document.getElementById('modal-venta').style.display = 'flex';
}

function cerrarModal(id) {
  document.getElementById(id).style.display = 'none';
}

function agregarItem() {
  const container = document.getElementById('venta-items');
  const div = document.createElement('div');
  div.className = 'item-row';
  div.innerHTML = `
    <select onchange="calcularTotal()">
      ${productos.filter(p => p.activo && p.stock > 0).map(p =>
        `<option value="${p._id}" data-precio="${p.precio}">${p.nombre} (stock: ${p.stock})</option>`
      ).join('')}
    </select>
    <input type="number" min="1" value="1" placeholder="Cantidad" oninput="calcularTotal()">
    <button onclick="this.parentElement.remove(); calcularTotal()">✕</button>
  `;
  container.appendChild(div);
  calcularTotal();
}

function calcularTotal() {
  const filas = document.querySelectorAll('#venta-items .item-row');
  let total = 0;
  filas.forEach(fila => {
    const sel = fila.querySelector('select');
    const cant= parseInt(fila.querySelector('input').value) || 0;
    const precio = sel.options[sel.selectedIndex]?.dataset.precio || 0;
    total += cant * parseFloat(precio);
  });
  document.getElementById('venta-total').textContent = `Total estimado: $${total.toLocaleString()}`;
}

async function crearVenta() {
  const clienteId = document.getElementById('venta-cliente').value;
  const modalidad = document.getElementById('venta-modalidad').value;
  const filas     = document.querySelectorAll('#venta-items .item-row');

  const items = Array.from(filas).map(fila => ({
    productoId: fila.querySelector('select').value,
    cantidad:   parseInt(fila.querySelector('input').value) || 1,
  }));

  if (!items.length) { mostrarToast('Agregá al menos un producto', 'error'); return; }

  try {
    const res  = await fetch('/api/ventas', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ clienteId, modalidad, items }),
    });
    const data = await res.json();

    if (!res.ok) {
      mostrarToast(data.error || 'Error al crear la venta', 'error');
      return;
    }

    cerrarModal('modal-venta');
    mostrarToast('✅ Venta registrada correctamente', 'ok');

    if (data.alertasStock?.length) {
      setTimeout(() => mostrarToast(`⚠ ${data.alertasStock[0].mensaje}`, 'warn'), 1200);
    }

    cargarSeccion('ventas');
  } catch (e) {
    mostrarToast('Error de red: ' + e.message, 'error');
  }
}

// ── Cancelar venta ────────────────────────────────────────────────────────────
async function cancelarVenta(id) {
  if (!confirm('¿Cancelar esta venta? Se revertirá el stock y la deuda.')) return;
  try {
    const res  = await fetch(`/api/ventas/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) { mostrarToast(data.error || 'Error al cancelar', 'error'); return; }
    mostrarToast('✅ Venta cancelada — stock y deuda revertidos', 'ok');
    cargarSeccion('ventas');
  } catch (e) {
    mostrarToast('Error de red: ' + e.message, 'error');
  }
}

// ── Logout ────────────────────────────────────────────────────────────────────
async function logout() {
  await fetch('/logout');
  window.location.href = '/login';
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function mostrarToast(mensaje, tipo = 'ok') {
  const toast = document.getElementById('toast');
  toast.textContent = mensaje;
  toast.className   = `toast ${tipo} show`;
  setTimeout(() => toast.classList.remove('show'), 3500);
}