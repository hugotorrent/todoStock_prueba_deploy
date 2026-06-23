import { state } from './state.js';
import { fetchAuth } from './auth.js';
import { mostrarToast } from './toast.js';

export async function abrirModalVenta() {
  const [resClientes, resProductos] = await Promise.all([
    fetchAuth('/api/clientes'),
    fetchAuth('/api/productos'),
  ]);

  state.clientes = await resClientes.json();
  state.productos = await resProductos.json();

  document.getElementById('venta-cliente').innerHTML = state.clientes
    .filter((cliente) => cliente.activo)
    .map((cliente) => `<option value="${cliente._id}">${cliente.razonSocial}</option>`)
    .join('');

  document.getElementById('venta-items').innerHTML = '';
  agregarItem();
  calcularTotal();
  document.getElementById('modal-venta').style.display = 'flex';
}

export function cerrarModal(id) {
  document.getElementById(id).style.display = 'none';
}

export function agregarItem() {
  const container = document.getElementById('venta-items');
  const itemRow = document.createElement('div');
  itemRow.className = 'item-row';

  const select = document.createElement('select');
  state.productos.filter((producto) => producto.activo && producto.stock > 0)
    .forEach((producto) => {
      const option = document.createElement('option');
      option.value = producto._id;
      option.dataset.precio = producto.precio;
      option.textContent = `${producto.nombre} (${producto.stock})`;
      select.appendChild(option);
    });
  select.addEventListener('change', calcularTotal);

  const input = document.createElement('input');
  input.type = 'number';
  input.min = '1';
  input.value = '1';
  input.placeholder = 'Cant.';
  input.addEventListener('input', calcularTotal);

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = '✕';
  button.addEventListener('click', () => {
    itemRow.remove();
    calcularTotal();
  });

  itemRow.appendChild(select);
  itemRow.appendChild(input);
  itemRow.appendChild(button);
  container.appendChild(itemRow);
  calcularTotal();
}

export function calcularTotal() {
  let total = 0;
  document.querySelectorAll('#venta-items .item-row').forEach((fila) => {
    const select = fila.querySelector('select');
    const cantidad = parseInt(fila.querySelector('input').value, 10) || 0;
    const precio = parseFloat(select.options[select.selectedIndex]?.dataset.precio || 0);
    total += cantidad * precio;
  });
  document.getElementById('venta-total').textContent = `Total estimado: $${total.toLocaleString()}`;
}

export async function crearVenta() {
  const clienteId = document.getElementById('venta-cliente').value;
  const modalidad = document.getElementById('venta-modalidad').value;
  const items = Array.from(document.querySelectorAll('#venta-items .item-row')).map((fila) => ({
    productoId: fila.querySelector('select').value,
    cantidad: parseInt(fila.querySelector('input').value, 10) || 1,
  }));

  if (!items.length) {
    mostrarToast('Agregá al menos un producto', 'error');
    return;
  }

  try {
    const res = await fetchAuth('/api/ventas', {
      method: 'POST',
      body: JSON.stringify({ clienteId, modalidad, items }),
    });

    if (!res) return;

    const data = await res.json();
    if (!res.ok) {
      mostrarToast(data.error || 'Error al crear la venta', 'error');
      return;
    }

    cerrarModal('modal-venta');
  } catch (error) {
    mostrarToast(`Error de red: ${error.message}`, 'error');
  }
}

export async function cancelarVenta(id) {
  if (!confirm('¿Cancelar esta venta? Se revertirá el stock y la deuda.')) return;

  try {
    const res = await fetchAuth(`/api/ventas/${id}`, { method: 'DELETE' });
    if (!res) return;
    const data = await res.json();
    if (!res.ok) {
      mostrarToast(data.error || 'Error al cancelar', 'error');
      return;
    }
  } catch (error) {
    mostrarToast(`Error de red: ${error.message}`, 'error');
  }
}
