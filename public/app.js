// ─── app.js (cliente) ─────────────────────────────────────────────────────────
// Panel SPA vanilla con JWT y WebSockets (Socket.io).

// ── Estado global ─────────────────────────────────────────────────────────────
let rolActual     = null;
let accessToken   = null;   // JWT — se renueva automáticamente antes de expirar
let seccionActual = 'ventas';
let datosActuales = [];
let productos     = [];
let clientes      = [];
let socket        = null;

// ── Inicialización ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  await iniciarSesion();
  conectarWebSocket();
  configurarNav();
  configurarBusqueda();
  cargarSeccion('ventas');
});

// ── JWT: obtener sesión ───────────────────────────────────────────────────────
// Intenta renovar el accessToken usando el refreshToken de la cookie.
// Si falla, redirige al login.
async function iniciarSesion() {
  try {
    const res  = await fetch('/api/refresh', { method: 'POST' });
    if (!res.ok) { window.location.href = '/login'; return; }
    const data = await res.json();
    accessToken = data.accessToken;
    rolActual   = data.rol;
    configurarRolUI();
    // Renovar el token 5 minutos antes de que expire (55 min si JWT_EXPIRES=1h)
    setTimeout(renovarToken, 55 * 60 * 1000);
  } catch {
    window.location.href = '/login';
  }
}

async function renovarToken() {
  try {
    const res  = await fetch('/api/refresh', { method: 'POST' });
    if (!res.ok) { window.location.href = '/login'; return; }
    const data = await res.json();
    accessToken = data.accessToken;
    setTimeout(renovarToken, 55 * 60 * 1000);
  } catch {
    window.location.href = '/login';
  }
}

// ── Fetch autenticado con JWT ─────────────────────────────────────────────────
async function fetchAuth(url, opciones = {}) {
  const res = await fetch(url, {
    ...opciones,
    headers: {
      ...opciones.headers,
      'Authorization': `Bearer ${accessToken}`,
      ...(opciones.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  if (res.status === 401) { window.location.href = '/login'; return null; }
  return res;
}

// ── Configurar UI según rol ───────────────────────────────────────────────────
function configurarRolUI() {
  const badge = document.getElementById('rol-badge');
  badge.textContent = rolActual === 'admin' ? 'Administrador' : 'Empleado';
  badge.className   = `rol-badge ${rolActual}`;
  if (rolActual !== 'admin') {
    document.querySelectorAll('.admin-only').forEach(el => el.classList.add('bloqueado'));
  }
}

// ── WebSocket con Socket.io ───────────────────────────────────────────────────
function conectarWebSocket() {
  socket = io();

  socket.on('connect', () => {
    console.log('🔌 WebSocket conectado:', socket.id);
  });

  // Cuando alguien crea una venta (desde cualquier cliente o Postman)
  socket.on('venta:nueva', (datos) => {
    mostrarToast(`Nueva venta — ${datos.cliente} · $${datos.total.toLocaleString()}`, 'ok');
    // Si el panel está mostrando ventas, recargar automáticamente
    if (seccionActual === 'ventas') cargarSeccion('ventas');
    // Si hay alertas de stock en la venta, mostrarlas
    if (datos.alertas?.length) {
      setTimeout(() => mostrarToast(datos.alertas[0].mensaje, 'warn'), 1500);
    }
  });

  // Cuando alguien cancela una venta
  socket.on('venta:cancelada', (datos) => {
    mostrarToast(`Venta cancelada — ${datos.cliente}`, 'warn');
    if (seccionActual === 'ventas') cargarSeccion('ventas');
  });

  socket.on('disconnect', () => {
    console.log('🔌 WebSocket desconectado');
  });
}

// ── Navegación ────────────────────────────────────────────────────────────────
function configurarNav() {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      if (item.classList.contains('bloqueado')) return;
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      cargarSeccion(item.dataset.seccion);
    });
  });
}

function configurarBusqueda() {
  document.getElementById('input-busqueda').addEventListener('input', filtrar);
  document.getElementById('filtro-estado').addEventListener('change', filtrar);
}

// ── Cargar sección ────────────────────────────────────────────────────────────
async function cargarSeccion(seccion) {
  seccionActual = seccion;
  document.getElementById('topbar-titulo').textContent = titulos[seccion] || seccion;

  const contenido     = document.getElementById('contenido');
  const btnNuevo      = document.getElementById('btn-nuevo');
  const barraBusqueda = document.getElementById('barra-busqueda');
  const filtroEstado  = document.getElementById('filtro-estado');

  contenido.innerHTML    = '<div class="spinner">Cargando...</div>';
  btnNuevo.style.display = 'none';
  barraBusqueda.style.display = 'none';
  filtroEstado.style.display  = 'none';
  document.getElementById('input-busqueda').value = '';

  if (seccion === 'resumen') { await cargarResumen(); return; }

  try {
    const res  = await fetchAuth(`/api/${seccion}`);
    if (!res) return;
    const data = await res.json();
    datosActuales = Array.isArray(data) ? data : (data.registros || []);

    barraBusqueda.style.display = 'flex';
    if (['productos', 'proveedores', 'clientes'].includes(seccion)) {
      filtroEstado.style.display = 'block';
    }
    if (seccion === 'ventas' && rolActual === 'admin') {
      btnNuevo.style.display = 'block';
      btnNuevo.onclick = abrirModalVenta;
    }
    if (seccion === 'proveedores' && rolActual === 'admin') {
      btnNuevo.style.display = 'block';
      btnNuevo.onclick = abrirModalProveedor;
    }
    if (seccion === 'productos' && rolActual === 'admin') {
      btnNuevo.style.display = 'block';
      btnNuevo.onclick = abrirModalProducto;
    }

    renderTabla(datosActuales, seccion);
  } catch (e) {
    contenido.innerHTML = `<div class="sin-datos">Error al cargar ${seccion}: ${e.message}</div>`;
  }
}

const titulos = {
  ventas: 'Ventas', productos: 'Productos',
  clientes: 'Clientes', proveedores: 'Proveedores', resumen: 'Dashboard'
};

// ── Filtrar ───────────────────────────────────────────────────────────────────
function filtrar() {
  const texto  = document.getElementById('input-busqueda').value.toLowerCase();
  const estado = document.getElementById('filtro-estado').value;
  const filtrados = datosActuales.filter(item => {
    const nombre = (item.nombre || item.razonSocial || '').toLowerCase();
    const coincideTexto  = nombre.includes(texto);
    const coincideEstado = !estado ||
      (estado === 'activo'   &&  item.activo) ||
      (estado === 'inactivo' && !item.activo);
    return coincideTexto && coincideEstado;
  });
  renderTabla(filtrados, seccionActual);
}

// ── Render tabla ──────────────────────────────────────────────────────────────
function renderTabla(datos, seccion) {
  const contenido = document.getElementById('contenido');
  if (!datos.length) {
    contenido.innerHTML = `<div class="tabla-wrap"><p class="sin-datos">No hay datos para mostrar.</p></div>`;
    return;
  }
  const renders = { ventas: renderVentas, productos: renderProductos, clientes: renderClientes, proveedores: renderProveedores };
  contenido.innerHTML = `<div class="tabla-wrap">${(renders[seccion] || (() => ''))(datos)}</div>`;
}

// ── Renders ───────────────────────────────────────────────────────────────────
function renderVentas(ventas) {
  const colAccion = rolActual === 'admin' ? '<th>Acciones</th>' : '';
  const filas = ventas.map(v => {
    const cliente  = v.clienteId ? v.clienteId.razonSocial : '—';
    const fecha    = new Date(v.createdAt).toLocaleDateString('es-AR');
    const estadoCls= v.estado === 'confirmada' ? 'badge-ok' : 'badge-danger';
    const accion   = rolActual === 'admin'
      ? (v.estado === 'confirmada'
          ? `<button class="btn-tabla danger" onclick="cancelarVenta('${v._id}')">Cancelar</button>`
          : '<span style="color:#d1d5db">—</span>')
      : '';
    return `<tr>
      <td>${cliente}</td><td>${v.modalidad}</td>
      <td>$${v.total.toLocaleString()}</td>
      <td><span class="badge ${estadoCls}">${v.estado}</span></td>
      <td>${v.items.length} ítem(s)</td><td>${fecha}</td>
      ${rolActual === 'admin' ? `<td>${accion}</td>` : ''}
    </tr>`;
  }).join('');
  return `<table><thead><tr>
    <th>Cliente</th><th>Modalidad</th><th>Total</th>
    <th>Estado</th><th>Ítems</th><th>Fecha</th>${colAccion}
  </tr></thead><tbody>${filas}</tbody></table>`;
}

function renderProductos(productos) {
  const filas = productos.map(p => {
    const prov = p.proveedorId ? p.proveedorId.razonSocial : '—';
    let stockBadge;
    if (p.stock <= 0)                  stockBadge = `<span class="badge badge-danger">Sin stock</span>`;
    else if (p.stock <= p.stockMinimo) stockBadge = `<span class="badge badge-warn">${p.stock} — mínimo</span>`;
    else                               stockBadge = `<span class="badge badge-ok">${p.stock}</span>`;
    const estadoBadge = p.activo ? '<span class="badge badge-ok">Activo</span>' : '<span class="badge badge-gray">Inactivo</span>';
    return `<tr><td>${p.nombre}</td><td>$${p.precio.toLocaleString()}</td>
      <td>${stockBadge}</td><td>${p.stockMinimo}</td><td>${prov}</td><td>${estadoBadge}</td></tr>`;
  }).join('');
  return `<table><thead><tr>
    <th>Nombre</th><th>Precio</th><th>Stock</th><th>Stock mín.</th><th>Proveedor</th><th>Estado</th>
  </tr></thead><tbody>${filas}</tbody></table>`;
}

function renderClientes(clientes) {
  const filas = clientes.map(c => {
    const pct = c.limiteCrediticio > 0 ? Math.round((c.deudaActual / c.limiteCrediticio) * 100) : 0;
    const deudaCls = pct >= 80 ? 'badge-danger' : 'badge-ok';
    const estadoBadge = c.activo ? '<span class="badge badge-ok">Activo</span>' : '<span class="badge badge-gray">Inactivo</span>';
    return `<tr><td>${c.razonSocial}</td><td>${c.cuit}</td><td>${c.condicionIva}</td>
      <td>$${c.limiteCrediticio.toLocaleString()}</td>
      <td><span class="badge ${deudaCls}">$${c.deudaActual.toLocaleString()} (${pct}%)</span></td>
      <td>${estadoBadge}</td></tr>`;
  }).join('');
  return `<table><thead><tr>
    <th>Razón Social</th><th>CUIT</th><th>Cond. IVA</th><th>Límite CC</th><th>Deuda</th><th>Estado</th>
  </tr></thead><tbody>${filas}</tbody></table>`;
}

function renderProveedores(proveedores) {
  const filas = proveedores.map(p => {
    const estadoBadge = p.activo ? '<span class="badge badge-ok">Activo</span>' : '<span class="badge badge-gray">Inactivo</span>';
    return `<tr><td>${p.razonSocial}</td><td>${p.cuit}</td>
      <td>${p.email||'—'}</td><td>${p.telefono||'—'}</td><td>${estadoBadge}</td></tr>`;
  }).join('');
  return `<table><thead><tr>
    <th>Razón Social</th><th>CUIT</th><th>Email</th><th>Teléfono</th><th>Estado</th>
  </tr></thead><tbody>${filas}</tbody></table>`;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
async function cargarResumen() {
  try {
    const res = await fetchAuth('/api/resumen');
    if (!res) return;
    const d   = await res.json();
    document.getElementById('contenido').innerHTML = `
      <div class="cards-grid">
        <div class="stat-card"><div class="val">${d.proveedores.activos}</div><div class="lbl">Proveedores</div><div class="sub">${d.proveedores.inactivos} inactivos</div></div>
        <div class="stat-card"><div class="val">${d.productos.activos}</div><div class="lbl">Productos</div><div class="sub">${d.productos.sinStock} sin stock · ${d.productos.enStockMinimo} en mínimo</div></div>
        <div class="stat-card"><div class="val">$${d.clientes.deudaTotalCartera.toLocaleString()}</div><div class="lbl">Deuda cartera</div><div class="sub">${d.clientes.conDeudaAlta} con deuda alta</div></div>
        <div class="stat-card"><div class="val">${d.ventas.hoy}</div><div class="lbl">Ventas hoy</div><div class="sub">$${d.ventas.totalHoy.toLocaleString()} facturado</div></div>
      </div>
      <div class="alertas-titulo">Alertas activas — ${d.alertas.total}</div>
      ${d.alertas.total === 0
        ? '<div class="sin-alertas">Sin alertas activas. El sistema opera con normalidad.</div>'
        : d.alertas.items.map(a => `
          <div class="alerta-item alerta-${a.urgencia}">
            <span class="alerta-label-${a.urgencia}">${a.urgencia}</span>
            <span><strong>${a.tipo}</strong> — ${a.mensaje}</span>
          </div>`).join('')
      }`;
  } catch (e) {
    document.getElementById('contenido').innerHTML = `<div class="sin-datos">Error: ${e.message}</div>`;
  }
}

// ── Modal nueva venta ─────────────────────────────────────────────────────────
async function abrirModalVenta() {
  const [resC, resP] = await Promise.all([
    fetchAuth('/api/clientes'),
    fetchAuth('/api/productos'),
  ]);
  clientes  = await resC.json();
  productos = await resP.json();

  document.getElementById('venta-cliente').innerHTML = clientes
    .filter(c => c.activo)
    .map(c => `<option value="${c._id}">${c.razonSocial}</option>`)
    .join('');
  document.getElementById('venta-items').innerHTML = '';
  agregarItem();
  calcularTotal();
  document.getElementById('modal-venta').style.display = 'flex';
}

function cerrarModal(id) { document.getElementById(id).style.display = 'none'; }

function agregarItem() {
  const container = document.getElementById('venta-items');
  const div = document.createElement('div');
  div.className = 'item-row';
  div.innerHTML = `
    <select onchange="calcularTotal()">
      ${productos.filter(p => p.activo && p.stock > 0).map(p =>
        `<option value="${p._id}" data-precio="${p.precio}">${p.nombre} (${p.stock})</option>`
      ).join('')}
    </select>
    <input type="number" min="1" value="1" placeholder="Cant." oninput="calcularTotal()">
    <button onclick="this.parentElement.remove(); calcularTotal()">✕</button>
  `;
  container.appendChild(div);
  calcularTotal();
}

function calcularTotal() {
  let total = 0;
  document.querySelectorAll('#venta-items .item-row').forEach(fila => {
    const sel    = fila.querySelector('select');
    const cant   = parseInt(fila.querySelector('input').value) || 0;
    const precio = parseFloat(sel.options[sel.selectedIndex]?.dataset.precio || 0);
    total += cant * precio;
  });
  document.getElementById('venta-total').textContent = `Total estimado: $${total.toLocaleString()}`;
}

async function crearVenta() {
  const clienteId = document.getElementById('venta-cliente').value;
  const modalidad = document.getElementById('venta-modalidad').value;
  const items     = Array.from(document.querySelectorAll('#venta-items .item-row')).map(f => ({
    productoId: f.querySelector('select').value,
    cantidad:   parseInt(f.querySelector('input').value) || 1,
  }));
  if (!items.length) { mostrarToast('Agregá al menos un producto', 'error'); return; }
  try {
    const res  = await fetchAuth('/api/ventas', {
      method: 'POST',
      body: JSON.stringify({ clienteId, modalidad, items }),
    });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) { mostrarToast(data.error || 'Error al crear la venta', 'error'); return; }
    cerrarModal('modal-venta');
    // El WebSocket ya va a notificar y recargar la tabla automáticamente
  } catch (e) {
    mostrarToast('Error de red: ' + e.message, 'error');
  }
}

async function cancelarVenta(id) {
  if (!confirm('¿Cancelar esta venta? Se revertirá el stock y la deuda.')) return;
  try {
    const res  = await fetchAuth(`/api/ventas/${id}`, { method: 'DELETE' });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) { mostrarToast(data.error || 'Error al cancelar', 'error'); return; }
    // El WebSocket notifica y recarga automáticamente
  } catch (e) {
    mostrarToast('Error de red: ' + e.message, 'error');
  }
}

async function logout() {
  await fetch('/logout');
  window.location.href = '/login';
}

function mostrarToast(mensaje, tipo = 'ok') {
  const toast = document.getElementById('toast');
  toast.textContent = mensaje;
  toast.className   = `toast ${tipo} show`;
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// ── NUEVO PROVEEDOR ───────────────────────────────────────────────────────────

function abrirModalProveedor() {
  // Limpiar campos
  ['prov-razonSocial','prov-cuit','prov-telefono','prov-email']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('modal-proveedor').style.display = 'flex';
}

async function guardarProveedor() {
  const razonSocial = document.getElementById('prov-razonSocial').value.trim();
  const cuit        = document.getElementById('prov-cuit').value.trim();
  const telefono    = document.getElementById('prov-telefono').value.trim();
  const email       = document.getElementById('prov-email').value.trim();

  if (!razonSocial || !cuit) {
    mostrarToast('Razón Social y CUIT son obligatorios', 'error');
    return;
  }

  try {
    const res  = await fetchAuth('/api/proveedores', {
      method: 'POST',
      body: JSON.stringify({ razonSocial, cuit, telefono, email }),
    });
    if (!res) return;
    const data = await res.json();

    if (!res.ok) {
      mostrarToast(data.error || 'Error al guardar el proveedor', 'error');
      return;
    }

    cerrarModal('modal-proveedor');
    mostrarToast(`Proveedor "${razonSocial}" guardado correctamente`, 'ok');
    cargarSeccion('proveedores'); // recargar la tabla
  } catch (e) {
    mostrarToast('Error de red: ' + e.message, 'error');
  }
}

// ── NUEVO PRODUCTO ────────────────────────────────────────────────────────────

async function abrirModalProducto() {
  // Cargar proveedores activos para el select
  try {
    const res        = await fetchAuth('/api/proveedores');
    const proveedores= await res.json();
    const activos    = proveedores.filter(p => p.activo);

    if (!activos.length) {
      mostrarToast('No hay proveedores activos. Creá uno primero.', 'warn');
      return;
    }

    document.getElementById('prod-proveedorId').innerHTML = activos
      .map(p => `<option value="${p._id}">${p.razonSocial}</option>`)
      .join('');
  } catch (e) {
    mostrarToast('Error al cargar proveedores: ' + e.message, 'error');
    return;
  }

  // Limpiar campos
  ['prod-nombre','prod-precio','prod-stock','prod-stockMinimo','prod-stockMaximo','prod-descripcion']
    .forEach(id => document.getElementById(id).value = '');

  document.getElementById('modal-producto').style.display = 'flex';
}

async function guardarProducto() {
  const nombre      = document.getElementById('prod-nombre').value.trim();
  const proveedorId = document.getElementById('prod-proveedorId').value;
  const precio      = parseFloat(document.getElementById('prod-precio').value);
  const stock       = parseInt(document.getElementById('prod-stock').value)       || 0;
  const stockMinimo = parseInt(document.getElementById('prod-stockMinimo').value) || 0;
  const stockMaximo = parseInt(document.getElementById('prod-stockMaximo').value) || 0;
  const descripcion = document.getElementById('prod-descripcion').value.trim();

  if (!nombre || !proveedorId || isNaN(precio)) {
    mostrarToast('Nombre, proveedor y precio son obligatorios', 'error');
    return;
  }
  if (precio < 0) {
    mostrarToast('El precio no puede ser negativo', 'error');
    return;
  }

  try {
    const res  = await fetchAuth('/api/productos', {
      method: 'POST',
      body: JSON.stringify({ nombre, proveedorId, precio, stock, stockMinimo, stockMaximo, descripcion }),
    });
    if (!res) return;
    const data = await res.json();

    if (!res.ok) {
      mostrarToast(data.error || 'Error al guardar el producto', 'error');
      return;
    }

    cerrarModal('modal-producto');
    mostrarToast(`Producto "${nombre}" guardado correctamente`, 'ok');
    cargarSeccion('productos'); // recargar la tabla
  } catch (e) {
    mostrarToast('Error de red: ' + e.message, 'error');
  }
}