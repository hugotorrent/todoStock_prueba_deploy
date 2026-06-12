// ─── schemas/pedido.schema.js ─────────────────────────────────────────────────
import mongoose from 'mongoose';

// Schema para cada item dentro del pedido (subdocumento)
// No es un modelo independiente — vive embebido dentro del pedido
const itemSchema = new mongoose.Schema(
  {
    productoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Producto',
      required: true,
    },
    cantidad: {
      type: Number,
      required: true,
      min: [1, 'La cantidad debe ser al menos 1'],
    },
    precioUnitario: {
      type: Number,
      required: true,
      min: [0, 'El precio no puede ser negativo'],
    },
  },
  { _id: false } // los items no necesitan su propio _id
);

const pedidoSchema = new mongoose.Schema(
  {
    clienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cliente',
      required: [true, 'El cliente es obligatorio'],
    },
    modalidad: {
      type: String,
      required: [true, 'La modalidad es obligatoria'],
      enum: {
        values: ['contado', 'cuenta_corriente'],
        message: 'Modalidad inválida. Valores: contado, cuenta_corriente',
      },
    },
    estado: {
      type: String,
      default: 'confirmado',
      enum: ['confirmado', 'cancelado'],
    },
    // Array de subdocumentos — cada item tiene productoId, cantidad y precio
    items: {
      type: [itemSchema],
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'El pedido debe tener al menos un producto',
      },
    },
    total: {
      type: Number,
      required: true,
      min: [0, 'El total no puede ser negativo'],
    },
  },
  { timestamps: true }
);

export default mongoose.model('Pedido', pedidoSchema);