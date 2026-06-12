// controllers/proveedores.controller.js
//
import Proveedor from '../models/proveedor.model.js';
import Producto from '../models/producto.model.js';

// Controladores para Proveedores
const obtenerTodos = async (req, res) => {
    try {
        const proveedores = await Proveedor.obtenerTodos();
        res.status(200).json(proveedores);
    } catch (error) {
        res.status(500).json({ error: 'Error al leer los proveedores.', detalle: error.message });
    }
};
// Obtener un proveedor por ID
const obtenerPorId = async (req, res) => {
    try {
        const proveedor = await Proveedor.obtenerPorId(req.params.id);
        if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado.' });
        res.status(200).json(proveedor);
    } catch (error) {
        res.status(500).json({ error: 'Error al leer el proveedor.', detalle: error.message });
    }
};

const crearProveedor = async (req, res) => {
    try {
        const proveedor = await Proveedor.crear(req.body);
        res.status(201).json({ mensaje: 'Proveedor creado.', proveedor });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const actualizarProveedor = async (req, res) => {
    try {
        const proveedor = await Proveedor.actualizar(req.params.id, req.body);
        if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado.' });
        res.status(200).json({ mensaje: 'Proveedor actualizado.', proveedor });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const eliminarProveedor = async (req, res) => {
    try {
        const id = req.params.id;
        const productos = await Producto.obtenerTodos();
        const tieneProductos = productos.some(p => p.proveedorId && p.proveedorId.toString() === id);
        if (tieneProductos) {
            return res.status(409).json({
                error: 'Operación denegada: el proveedor tiene productos asociados. Se desactivará en su lugar.'
            });
        }

        const proveedor = await Proveedor.desactivar(id);
        if (!proveedor) return res.status(404).json({ error: 'Proveedor no encontrado.' });
        res.status(200).json({ mensaje: `Proveedor ${id} desactivado correctamente.`, proveedor });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el proveedor.', detalle: error.message });
    }
};

// Exportar controladores
export default { obtenerTodos, obtenerPorId, crearProveedor, actualizarProveedor, eliminarProveedor };