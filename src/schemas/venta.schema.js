// ─── schemas/venta.schema.js ──────────────────────────────────────────────────
// NUEVO en segunda entrega — no existía en la primera.
// Define la estructura del documento Venta en MongoDB.
// Reemplaza la clase Venta que usaba fs + JSON en la primera entrega.

import mongoose from 'mongoose';

// Subdocumento: cada item dentro de la venta.
// No es una colección separada — vive embebido dentro del documento Venta.
// El precio se guarda al momento de la venta para que cambios futuros
// de precio no alteren registros históricos.
const itemSchema = new mongoose.Schema(
  {
    productoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Producto',   // referencia a la colección Producto para populate()
      required: true,
    },
    cantidad:       { type: Number, required: true, min: [1, 'La cantidad debe ser al menos 1'] },
    precioUnitario: { type: Number, required: true, min: [0, 'El precio no puede ser negativo'] },
  },
  { _id: false } // los items no necesitan su propio _id
);

const ventaSchema = new mongoose.Schema(
  {
    clienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cliente',    // referencia a la colección Cliente para populate()
      required: [true, 'El cliente es obligatorio'],
    },
    modalidad: {
      type: String,
      required: [true, 'La modalidad es obligatoria'],
      // enum restringe los valores — Mongoose valida automáticamente
      enum: {
        values: ['contado', 'cuenta_corriente'],
        message: 'Modalidad inválida. Valores: contado, cuenta_corriente',
      },
    },
    estado: {
      type: String,
      default: 'confirmada',
      enum: ['confirmada', 'cancelada'],
    },
    items: {
      type: [itemSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'La venta debe tener al menos un producto',
      },
    },
    total: { type: Number, required: true, min: [0, 'El total no puede ser negativo'] },
  },
  // timestamps agrega createdAt y updatedAt automáticamente a cada documento
  { timestamps: true }
);

// 'Venta' → MongoDB crea automáticamente la colección 'ventas' (plural)
export default mongoose.model('Venta', ventaSchema);