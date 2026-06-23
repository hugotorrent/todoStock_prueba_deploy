import { iniciarSesion, logout } from './auth.js';
import { configurarNav, configurarBusqueda, configurarRolUI } from './ui.js';
import { cargarSeccion, filtrar } from './sections.js';
import { conectarSocket } from './socket.js';
import { abrirModalVenta, crearVenta, calcularTotal, agregarItem, cancelarVenta } from './ventas.js';
import { abrirModalProveedor, guardarProveedor, abrirModalProducto, guardarProducto, abrirModalCliente, guardarCliente, abrirModalAgregarStock, guardarStock, cerrarModal } from './forms.js';

window.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('btn-logout').addEventListener('click', logout);
  const btnAgregarItem = document.getElementById('btn-agregar-item');
  if (btnAgregarItem) btnAgregarItem.addEventListener('click', agregarItem);
  const btnConfirmarVenta = document.getElementById('btn-confirmar-venta');
  if (btnConfirmarVenta) btnConfirmarVenta.addEventListener('click', crearVenta);
  const btnGuardarProveedor = document.getElementById('btn-guardar-proveedor');
  if (btnGuardarProveedor) btnGuardarProveedor.addEventListener('click', guardarProveedor);
  const btnGuardarProducto = document.getElementById('btn-guardar-producto');
  if (btnGuardarProducto) btnGuardarProducto.addEventListener('click', guardarProducto);
  const btnGuardarCliente = document.getElementById('btn-guardar-cliente');
  if (btnGuardarCliente) btnGuardarCliente.addEventListener('click', guardarCliente);
  const btnGuardarStock = document.getElementById('btn-guardar-stock');
  if (btnGuardarStock) btnGuardarStock.addEventListener('click', guardarStock);

  document.querySelectorAll('.modal-close').forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.target;
      if (target) document.getElementById(target).style.display = 'none';
    });
  });
  await iniciarSesion();
  configurarRolUI();

  const callbacks = {
    onNuevoVenta: abrirModalVenta,
    onNuevoProveedor: abrirModalProveedor,
    onNuevoProducto: abrirModalProducto,
    onNuevoCliente: abrirModalCliente,
    onAgregarStock: abrirModalAgregarStock,
    onCancelarVenta: cancelarVenta,
  };

  conectarSocket({
    onVentaNueva: async () => { await cargarSeccion('ventas', callbacks); },
    onVentaCancelada: async () => { await cargarSeccion('ventas', callbacks); },
  });

  configurarNav(async (seccion) => cargarSeccion(seccion, callbacks));
  configurarBusqueda(filtrar);
  await cargarSeccion('ventas', callbacks);
});
