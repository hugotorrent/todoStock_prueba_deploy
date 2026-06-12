import Producto from '../models/producto.model.js';
import Venta from '../models/venta.model.js';

const obtenerTodos = async (req, res) => {
    try {
        const productos = await Producto.obtenerTodos();
        res.status(200).json(productos);
    } catch (error) {
        res.status(500).json({ error: 'Error al leer los productos.', detalle: error.message });
    }
};

const obtenerPorId = async (req, res) => {
    try {
        const producto = await Producto.obtenerPorId(req.params.id);
        if (!producto) return res.status(404).json({ error: 'Producto no encontrado.' });
        res.status(200).json(producto);
    } catch (error) {
        res.status(500).json({ error: 'Error al leer el producto.', detalle: error.message });
    }
};

const crearProducto = async (req, res) => {
    try {
        const producto = await Producto.crear(req.body);
        res.status(201).json({ mensaje: 'Producto creado con éxito.', producto });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const actualizarProducto = async (req, res) => {
    try {
        const producto = await Producto.actualizar(req.params.id, req.body);
        if (!producto) return res.status(404).json({ error: 'Producto no encontrado.' });
        res.status(200).json({ mensaje: 'Producto actualizado.', producto });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const eliminarProducto = async (req, res) => {
    try {
        const id = req.params.id;

        // Validación de integridad referencial
        const ventas = await Venta.obtenerTodos();
        const estaEnVentas = ventas.some(v => v.items.some(i => i.productoId.toString() === id));
        if (estaEnVentas) {
            return res.status(409).json({
                error: 'Operación denegada: el producto forma parte de una o más ventas registradas.'
            });
        }

        const producto = await Producto.desactivar(id);
        if (!producto) return res.status(404).json({ error: 'Producto no encontrado.' });
        res.status(200).json({ mensaje: `Producto ${id} desactivado correctamente.`, producto });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el producto.', detalle: error.message });
    }
};

export default { obtenerTodos, obtenerPorId, crearProducto, actualizarProducto, eliminarProducto };