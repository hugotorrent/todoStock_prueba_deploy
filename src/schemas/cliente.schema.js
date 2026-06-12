// ─── schemas/cliente.schema.js ────────────────────────────────────────────────
import mongoose from 'mongoose';

const clienteSchema = new mongoose.Schema(
  {
    razonSocial: {
      type: String,
      required: [true, 'La razón social es obligatoria'],
      trim: true,
    },
    cuit: {
      type: String,
      required: [true, 'El CUIT es obligatorio'],
      unique: true,
      trim: true,
    },
    condicionIva: {
      type: String,
      required: [true, 'La condición de IVA es obligatoria'],
      // enum restringe los valores aceptados — Mongoose valida esto automáticamente
      enum: {
        values: ['responsable_inscripto', 'monotributista', 'consumidor_final', 'exento'],
        message: 'Condición de IVA inválida. Valores: responsable_inscripto, monotributista, consumidor_final, exento'
      },
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
    limiteCrediticio: {
      type: Number,
      default: 0,
      min: [0, 'El límite crediticio no puede ser negativo'],
    },
    deudaActual: {
      type: Number,
      default: 0,
      min: [0, 'La deuda no puede ser negativa'],
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Cliente', clienteSchema);