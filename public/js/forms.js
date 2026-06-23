import { fetchAuth } from './auth.js';
import { mostrarToast } from './toast.js';
import { cargarSeccion } from './sections.js';

export function abrirModalProveedor() {
  ['prov-razonSocial', 'prov-cuit', 'prov-telefono', 'prov-email'].forEach((id) => {
    document.getElementById(id).value = '';
  });
  document.getElementById('modal-proveedor').style.display = 'flex';
}

export async function guardarProveedor() {
  const razonSocial = document.getElementById('prov-razonSocial').value.trim();
  const cuit = document.getElementById('prov-cuit').value.trim();
  const telefono = document.getElementById('prov-telefono').value.trim();
  const email = document.getElementById('prov-email').value.trim();

  if (!razonSocial || !cuit) {
    mostrarToast('Razón Social y CUIT son obligatorios', 'error');
    return;
  }

  try {
    const res = await fetchAuth('/api/proveedores', {
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
    await cargarSeccion('proveedores');
  } catch (error) {
    mostrarToast(`Error de red: ${error.message}`, 'error');
  }
}

export async function abrirModalProducto() {
  try {
    const res = await fetchAuth('/api/proveedores');
    const proveedores = await res.json();
    const activos = proveedores.filter((prov) => prov.activo);

    if (!activos.length) {
      mostrarToast('No hay proveedores activos. Creá uno primero.', 'warn');
      return;
    }

    document.getElementById('prod-proveedorId').innerHTML = activos
      .map((prov) => `<option value="${prov._id}">${prov.razonSocial}</option>`)
      .join('');
  } catch (error) {
    mostrarToast(`Error al cargar proveedores: ${error.message}`, 'error');
    return;
  }

  ['prod-nombre', 'prod-precio', 'prod-stock', 'prod-stockMinimo', 'prod-stockMaximo', 'prod-descripcion'].forEach((id) => {
    document.getElementById(id).value = '';
  });

  document.getElementById('modal-producto').style.display = 'flex';
}

export async function guardarProducto() {
  const nombre = document.getElementById('prod-nombre').value.trim();
  const proveedorId = document.getElementById('prod-proveedorId').value;
  const precio = parseFloat(document.getElementById('prod-precio').value);
  const stock = parseInt(document.getElementById('prod-stock').value, 10) || 0;
  const stockMinimo = parseInt(document.getElementById('prod-stockMinimo').value, 10) || 0;
  const stockMaximo = parseInt(document.getElementById('prod-stockMaximo').value, 10) || 0;
  const descripcion = document.getElementById('prod-descripcion').value.trim();

  if (!nombre || !proveedorId || Number.isNaN(precio)) {
    mostrarToast('Nombre, proveedor y precio son obligatorios', 'error');
    return;
  }
  if (precio < 0) {
    mostrarToast('El precio no puede ser negativo', 'error');
    return;
  }

  try {
    const res = await fetchAuth('/api/productos', {
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
    await cargarSeccion('productos');
  } catch (error) {
    mostrarToast(`Error de red: ${error.message}`, 'error');
  }
}

export function abrirModalCliente() {
  ['cli-razonSocial', 'cli-cuit', 'cli-telefono', 'cli-email', 'cli-limiteCrediticio'].forEach((id) => {
    document.getElementById(id).value = '';
  });
  document.getElementById('cli-condicionIva').value = 'consumidor_final';
  document.getElementById('modal-cliente').style.display = 'flex';
}

export async function guardarCliente() {
  const razonSocial = document.getElementById('cli-razonSocial').value.trim();
  const cuit = document.getElementById('cli-cuit').value.trim();
  const condicionIva = document.getElementById('cli-condicionIva').value;
  const telefono = document.getElementById('cli-telefono').value.trim();
  const email = document.getElementById('cli-email').value.trim();
  const limiteCrediticio = parseFloat(document.getElementById('cli-limiteCrediticio').value) || 0;

  if (!razonSocial || !cuit) {
    mostrarToast('Razón Social y CUIT son obligatorios', 'error');
    return;
  }

  try {
    const res = await fetchAuth('/api/clientes', {
      method: 'POST',
      body: JSON.stringify({ razonSocial, cuit, condicionIva, telefono, email, limiteCrediticio }),
    });
    if (!res) return;

    const data = await res.json();
    if (!res.ok) {
      mostrarToast(data.error || 'Error al guardar el cliente', 'error');
      return;
    }

    cerrarModal('modal-cliente');
    mostrarToast(`Cliente "${razonSocial}" guardado correctamente`, 'ok');
    await cargarSeccion('clientes');
  } catch (error) {
    mostrarToast(`Error de red: ${error.message}`, 'error');
  }
}

export async function abrirModalAgregarStock() {
  try {
    const res = await fetchAuth('/api/productos');
    const productos = await res.json();
    const activos = productos.filter((producto) => producto.activo);

    document.getElementById('stock-productoId').innerHTML = activos
      .map((producto) => `<option value="${producto._id}">${producto.nombre} (stock actual: ${producto.stock})</option>`)
      .join('');
  } catch (error) {
    mostrarToast(`Error al cargar productos: ${error.message}`, 'error');
    return;
  }

  document.getElementById('stock-cantidad').value = '';
  document.getElementById('modal-stock').style.display = 'flex';
}

export async function guardarStock() {
  const productoId = document.getElementById('stock-productoId').value;
  const cantidad = parseInt(document.getElementById('stock-cantidad').value, 10);

  if (!cantidad || cantidad <= 0) {
    mostrarToast('Ingresá una cantidad válida mayor a 0', 'error');
    return;
  }

  try {
    const resGet = await fetchAuth(`/api/productos/${productoId}`);
    const producto = await resGet.json();
    const nuevoStock = producto.stock + cantidad;

    const res = await fetchAuth(`/api/productos/${productoId}`, {
      method: 'PUT',
      body: JSON.stringify({ stock: nuevoStock }),
    });
    if (!res) return;

    const data = await res.json();
    if (!res.ok) {
      mostrarToast(data.error || 'Error al actualizar el stock', 'error');
      return;
    }

    cerrarModal('modal-stock');
    mostrarToast(`Stock actualizado — ${producto.nombre}: ${producto.stock} → ${nuevoStock}`, 'ok');
    await cargarSeccion('productos');
  } catch (error) {
    mostrarToast(`Error de red: ${error.message}`, 'error');
  }
}

function cerrarModal(id) {
  document.getElementById(id).style.display = 'none';
}
