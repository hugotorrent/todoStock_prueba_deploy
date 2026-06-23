import { state } from './state.js';

export function configurarRolUI() {
  const badge = document.getElementById('rol-badge');
  badge.textContent = state.rolActual === 'admin' ? 'Administrador' : 'Empleado';
  badge.className = `rol-badge ${state.rolActual}`;

  if (state.rolActual !== 'admin') {
    document.querySelectorAll('.admin-only').forEach((element) => {
      element.classList.add('bloqueado');
    });
  }
}

export function configurarNav(onSectionSelected) {
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('click', async (event) => {
      event.preventDefault();
      if (item.classList.contains('bloqueado')) return;
      document.querySelectorAll('.nav-item').forEach((navItem) => navItem.classList.remove('active'));
      item.classList.add('active');
      await onSectionSelected(item.dataset.seccion);
    });
  });
}

export function configurarBusqueda(onFilter) {
  const input = document.getElementById('input-busqueda');
  const filtro = document.getElementById('filtro-estado');

  input.addEventListener('input', onFilter);
  filtro.addEventListener('change', onFilter);
}

export function limpiarBusqueda() {
  document.getElementById('input-busqueda').value = '';
  document.getElementById('filtro-estado').value = '';
}
