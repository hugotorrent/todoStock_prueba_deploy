// ─── schemas/producto.schema.js ───────────────────────────────────────────────
import mongoose from 'mongoose';

const productoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre del producto es obligatorio'],
      trim: true,
    },
    descripcion: {
      type: String,
      default: '',
    },
    precio: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },
    stock: {
      type: Number,
      default: 0,
      min: [0, 'El stock no puede ser negativo'],
    },
    stockMinimo: {
      type: Number,
      default: 0,
    },
    stockMaximo: {
      type: Number,
      default: 0,
    },
    // Referencia al documento Proveedor.
    // ObjectId es el tipo nativo de MongoDB para referencias entre colecciones.
    // ref: 'Proveedor' le dice a Mongoose qué colección poblar con .populate()
    proveedorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Proveedor',
      required: [true, 'El proveedor es obligatorio'],
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Producto', productoSchema);