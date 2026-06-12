const validarNuevoProducto = (req, res, next) => {
    const { nombre, precio, stock } = req.body;

    // Si falta alguno de los datos obligatorios, cortamos la ejecución 
    if (!nombre || !precio || stock === undefined) {
        return res.status(400).json({ 
            error: "Datos incompletos. El producto debe tener nombre, precio y stock." 
        });
    }

    // Si el precio es negativo, también lo rebotamos
    if (precio <= 0) {
        return res.status(400).json({ 
            error: "El precio debe ser mayor a 0." 
        });
    }

    // Si todo está bien, lo dejamos pasar al controlador
    next();
};

export { validarNuevoProducto };