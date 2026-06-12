// ─── middlewares/logger.middleware.js ────────────────────────────────────────
// SEGUNDA ENTREGA — Mejorado respecto a la primera entrega.
//
// PRIMERA ENTREGA:
//   - Solo imprimía en consola el método y la URL
//   - No persistía nada en disco
//
// SEGUNDA ENTREGA agrega:
//   - Registro del status HTTP de la respuesta
//   - Duración de la request en milisegundos
//   - Persistencia en auditoria.json para las operaciones de escritura
//     (POST, PUT, DELETE) — solo las que modifican datos, no las lecturas GET

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// En ESM, las variables globales __dirname y __filename no existen por defecto.
// Tenemos que recrearlas usando import.meta.url para poder armar rutas absolutas:
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOG_PATH = path.join(__dirname, '../data/auditoria.json');

// Inicializar el archivo de auditoría si no existe
if (!fs.existsSync(LOG_PATH)) {
  fs.writeFileSync(LOG_PATH, JSON.stringify([], null, 2), 'utf-8');
}

// CAMBIO de nombre de exportación: ahora exportamos como { registrarPeticion }
// para mantener compatibilidad con el app.js existente del proyecto
export const registrarPeticion = (req, res, next) => {
  const inicio = Date.now();
  const fecha  = new Date().toLocaleString('es-AR');

  // NUEVO: usamos res.on('finish') para capturar el status HTTP real
  // que devolvió el controller. Cuando el middleware se ejecuta,
  // la respuesta todavía no existe — el evento 'finish' se dispara
  // cuando Express termina de enviarla.
  res.on('finish', () => {
    const duracion = Date.now() - inicio;
    const registro = {
      fecha:    new Date().toISOString(),
      metodo:   req.method,
      ruta:     req.originalUrl,
      status:   res.statusCode,
      duracion: `${duracion}ms`,
    };

    // Imprimir en consola con colores según el status HTTP
    const color = res.statusCode >= 500 ? '\x1b[31m'  // rojo  — error de servidor
                : res.statusCode >= 400 ? '\x1b[33m'  // amarillo — error de cliente
                : '\x1b[32m';                          // verde — éxito
    console.log(
      `${color}[${fecha}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${duracion}ms)\x1b[0m`
    );

    // NUEVO: persistir en auditoria.json solo operaciones de escritura
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
      try {
        const logs = JSON.parse(fs.readFileSync(LOG_PATH, 'utf-8'));
        logs.push(registro);
        // Mantener solo los últimos 100 registros
        if (logs.length > 100) logs.splice(0, logs.length - 100);
        fs.writeFileSync(LOG_PATH, JSON.stringify(logs, null, 2), 'utf-8');
      } catch (e) {
        // Si falla el log, no interrumpimos la request
        console.error('Error al escribir auditoría:', e.message);
      }
    }
  });

  // next() permite que la request continúe hacia el siguiente middleware o ruta
  next();
};