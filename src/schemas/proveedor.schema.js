// ─── schemas/proveedor.schema.js ─────────────────────────────────────────────
// Define la estructura de un documento Proveedor en MongoDB.
// Mongoose usa este schema para validar datos antes de escribir en la BD.

import mongoose from 'mongoose';

const proveedorSchema = new mongoose.Schema(
  {
    razonSocial: {
      type: String,
      required: [true, 'La razón social es obligatoria'],
      trim: true,                    // elimina espacios al inicio y al final
    },
    cuit: {
      type: String,
      required: [true, 'El CUIT es obligatorio'],
      unique: true,                  // MongoDB rechaza CUITs duplicados
      trim: true,
    },
    telefono: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      default: '',
      trim: true,
    },
    activo: {
      type: Boolean,
      default: true,                 // todo proveedor nace activo
    },
  },
  {
    // timestamps agrega automáticamente createdAt y updatedAt a cada documento
    // útil para auditoría sin tener que hacerlo a mano
    timestamps: true,
  }
);

// Exportamos el Model (no el Schema).
// El Model es la clase con la que hacemos find(), save(), etc.
// 'Proveedor' es el nombre → MongoDB crea la colección 'proveedores' (plural automático)
export default mongoose.model('Proveedor', proveedorSchema);