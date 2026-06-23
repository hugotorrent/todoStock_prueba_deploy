import { fetchAuth } from './auth.js';
import { mostrarToast } from './toast.js';

export async function cargarResumen() {
  try {
    const res = await fetchAuth('/api/resumen');
    if (!res) return;
    const d = await res.json();

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
  } catch (error) {
    document.getElementById('contenido').innerHTML = `<div class="sin-datos">Error: ${error.message}</div>`;
    mostrarToast('Error al cargar el dashboard', 'error');
  }
}
