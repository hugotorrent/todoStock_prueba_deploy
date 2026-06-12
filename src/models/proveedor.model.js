// ─── models/proveedor.model.js ────────────────────────────────────────────────
// Misma lógica de negocio que antes.
// Cambió: fs.readFile/writeFile → await Proveedor.find() / doc.save()

import Proveedor from '../schemas/proveedor.schema.js';

async function obtenerTodos() {
  return await Proveedor.find();
}

async function obtenerPorId(id) {
  // findById devuelve null si no existe — mismo comportamiento que antes
  try {
    return await Proveedor.findById(id);
  } catch {
    return null; // id con formato inválido de MongoDB
  }
}

async function crear(datos) {
  // Verificar CUIT duplicado
  const existe = await Proveedor.findOne({ cuit: datos.cuit });
  if (existe) {
    throw new Error(`Ya existe un proveedor con el CUIT ${datos.cuit}`);
  }

  const nuevo = new Proveedor({
    razonSocial: datos.razonSocial,
    cuit:        datos.cuit,
    telefono:    datos.telefono || '',
    email:       datos.email    || '',
  });

  return await nuevo.save();
}

async function actualizar(id, datos) {
  if (datos.cuit) {
    const existe = await Proveedor.findOne({ cuit: datos.cuit, _id: { $ne: id } });
    if (existe) throw new Error(`Ya existe un proveedor con el CUIT ${datos.cuit}`);
  }

  // { new: true } devuelve el documento ya actualizado
  // runValidators aplica las reglas del schema al hacer update
  return await Proveedor.findByIdAndUpdate(id, datos, { new: true, runValidators: true });
}

async function desactivar(id) {
  return await Proveedor.findByIdAndUpdate(id, { activo: false }, { new: true });
}

export default { obtenerTodos, obtenerPorId, crear, actualizar, desactivar };