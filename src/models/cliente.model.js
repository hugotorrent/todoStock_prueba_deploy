// ─── models/cliente.model.js ──────────────────────────────────────────────────
import Cliente from '../schemas/cliente.schema.js';

// ── Lógica de crédito (sin cambios) ──────────────────────────────────────────
function evaluarCredito(cliente, montoNuevo) {
  const disponible   = cliente.limiteCrediticio - cliente.deudaActual;
  const puedeComprar = montoNuevo <= disponible;
  return {
    puedeComprar,
    limiteCrediticio: cliente.limiteCrediticio,
    deudaActual:      cliente.deudaActual,
    montoSolicitado:  montoNuevo,
    disponible,
    mensaje: puedeComprar
      ? `Crédito aprobado. Disponible restante: $${disponible - montoNuevo}`
      : `Crédito insuficiente. Disponible: $${disponible}, solicitado: $${montoNuevo}`
  };
}

// ── CRUD ──────────────────────────────────────────────────────────────────────
async function obtenerTodos() {
  return await Cliente.find();
}

async function obtenerPorId(id) {
  try {
    return await Cliente.findById(id);
  } catch {
    return null;
  }
}

async function crear(datos) {
  const existe = await Cliente.findOne({ cuit: datos.cuit });
  if (existe) throw new Error(`Ya existe un cliente con el CUIT ${datos.cuit}`);

  const nuevo = new Cliente({
    razonSocial:      datos.razonSocial,
    cuit:             datos.cuit,
    condicionIva:     datos.condicionIva,
    telefono:         datos.telefono || '',
    email:            datos.email    || '',
    limiteCrediticio: datos.limiteCrediticio || 0,
    deudaActual:      0,
  });

  return await nuevo.save();
}

async function actualizar(id, datos) {
  // Protección: la deuda no se toca desde el update genérico
  if (datos.deudaActual !== undefined) {
    throw new Error('La deuda no puede modificarse directamente. Use los endpoints de cuenta corriente.');
  }
  if (datos.cuit) {
    const existe = await Cliente.findOne({ cuit: datos.cuit, _id: { $ne: id } });
    if (existe) throw new Error(`Ya existe un cliente con el CUIT ${datos.cuit}`);
  }

  return await Cliente.findByIdAndUpdate(id, datos, { new: true, runValidators: true });
}

async function desactivar(id) {
  const cliente = await Cliente.findById(id);
  if (!cliente) return null;
  if (cliente.deudaActual > 0) {
    throw new Error(`No se puede desactivar "${cliente.razonSocial}" porque tiene deuda pendiente de $${cliente.deudaActual}`);
  }
  cliente.activo = false;
  return await cliente.save();
}

// ── Cuenta corriente ──────────────────────────────────────────────────────────
async function registrarDeuda(clienteId, monto) {
  const cliente = await Cliente.findById(clienteId);
  if (!cliente) throw new Error(`Cliente "${clienteId}" no encontrado`);
  cliente.deudaActual += monto;
  return await cliente.save();
}

async function saldarDeuda(clienteId, monto) {
  const cliente = await Cliente.findById(clienteId);
  if (!cliente) throw new Error(`Cliente "${clienteId}" no encontrado`);
  if (monto > cliente.deudaActual) {
    throw new Error(`El monto a saldar ($${monto}) supera la deuda actual ($${cliente.deudaActual})`);
  }
  cliente.deudaActual -= monto;
  return await cliente.save();
}

export default { obtenerTodos, obtenerPorId, crear, actualizar, desactivar, evaluarCredito, registrarDeuda, saldarDeuda };