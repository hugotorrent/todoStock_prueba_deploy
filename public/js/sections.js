import { state, titulos } from './state.js';
import { fetchAuth } from './auth.js';
import { renderTabla, attachTablaActions } from './renderers.js';
import { cargarResumen } from './dashboard.js';
import { mostrarToast } from './toast.js';

function resetSectionView() {
  const contenido = document.getElementById('contenido');
  const btnNuevo = document.getElementById('btn-nuevo');
  const barraBusqueda = document.getElementById('barra-busqueda');
  const filtroEstado = document.getElementById('filtro-estado');

  contenido.innerHTML = '<div class="spinner">Cargando...</div>';
  btnNuevo.style.display = 'none';
  btnNuevo.textContent = '+ Nuevo';
  barraBusqueda.style.display = 'none';
  filtroEstado.style.display = 'none';
  document.getElementById('input-busqueda').value = '';
}

function configurarBotonNuevo(seccion, callbacks = {}) {
  const btnNuevo = document.getElementById('btn-nuevo');
  btnNuevo.style.display = 'none';
  btnNuevo.onclick = null;

  if (seccion === 'ventas' && state.rolActual === 'admin') {
    btnNuevo.style.display = 'block';
    btnNuevo.textContent = '+ Nuevo';
    btnNuevo.onclick = callbacks.onNuevoVenta;
  }

  if (seccion === 'proveedores' && state.rolActual === 'admin') {
    btnNuevo.style.display = 'block';
    btnNuevo.textContent = '+ Nuevo proveedor';
    btnNuevo.onclick = callbacks.onNuevoProveedor;
  }

  if (seccion === 'productos' && state.rolActual === 'admin') {
    btnNuevo.style.display = 'block';
    btnNuevo.textContent = '+ Nuevo';
    btnNuevo.onclick = callbacks.onNuevoProducto;
  }

  if (seccion === 'productos' && state.rolActual === 'empleado') {
    btnNuevo.style.display = 'block';
    btnNuevo.textContent = '+ Agregar al inventario';
    btnNuevo.onclick = callbacks.onAgregarStock;
  }

  if (seccion === 'clientes' && state.rolActual === 'admin') {
    btnNuevo.style.display = 'block';
    btnNuevo.textContent = '+ Nuevo cliente';
    btnNuevo.onclick = callbacks.onNuevoCliente;
  }
}

export async function cargarSeccion(seccion, callbacks = {}) {
  state.seccionActual = seccion;
  document.getElementById('topbar-titulo').textContent = titulos[seccion] || seccion;
  resetSectionView();

  const filtroEstado = document.getElementById('filtro-estado');

  if (seccion === 'resumen') {
    configurarBotonNuevo(seccion, callbacks);
    await cargarResumen();
    return;
  }

  try {
    const res = await fetchAuth(`/api/${seccion}`);
    if (!res) return;

    const data = await res.json();
    state.datosActuales = Array.isArray(data) ? data : (data.registros || []);

    const barraBusqueda = document.getElementById('barra-busqueda');
    barraBusqueda.style.display = 'flex';
    filtroEstado.style.display = ['productos', 'proveedores', 'clientes'].includes(seccion) ? 'block' : 'none';

    configurarBotonNuevo(seccion, callbacks);
    renderTabla(state.datosActuales, seccion);
    attachTablaActions(seccion, { onCancelarVenta: callbacks.onCancelarVenta });
  } catch (error) {
    document.getElementById('contenido').innerHTML = `<div class="sin-datos">Error al cargar ${seccion}: ${error.message}</div>`;
    mostrarToast(`Error al cargar ${seccion}`, 'error');
  }
}

export function filtrar() {
  const texto = document.getElementById('input-busqueda').value.toLowerCase();
  const estado = document.getElementById('filtro-estado').value;
  const filtrados = state.datosActuales.filter((item) => {
    const nombre = (item.nombre || item.razonSocial || '').toLowerCase();
    const coincideTexto = nombre.includes(texto);
    const coincideEstado = !estado ||
      (estado === 'activo' && item.activo) ||
      (estado === 'inactivo' && !item.activo);
    return coincideTexto && coincideEstado;
  });

  renderTabla(filtrados, state.seccionActual);
}
