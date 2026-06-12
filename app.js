// ─── app.js ───────────────────────────────────────────────────────────────────
import express from 'express';

// --- IMPORTACIÓN DE RUTAS API ---
import productosRoutes   from './src/routes/productos.routes.js';
import proveedoresRoutes from './src/routes/proveedores.routes.js';
import clientesRoutes    from './src/routes/clientes.routes.js';
import ventasRoutes      from './src/routes/ventas.routes.js';
import resumenRoutes     from './src/routes/resumen.routes.js';
import auditoriaRoutes   from './src/routes/auditoria.routes.js';
import resumenController from './src/controllers/resumen.controller.js';

// --- IMPORTACIÓN DE MIDDLEWARES ---
import { registrarPeticion } from './src/middlewares/logger.middleware.js';
import validarJson           from './src/middlewares/validarJson.middleware.js';
// NUEVO: middleware de autenticación con cookie simple
import { verificarLogin, procesarLogin, procesarLogout } from './src/middlewares/auth.middleware.js';

// --- IMPORTACIÓN DE MODELOS (para vistas Pug) ---
import ProductoModel  from './src/models/producto.model.js';
import ProveedorModel from './src/models/proveedor.model.js';
import ClienteModel   from './src/models/cliente.model.js';
import VentaModel     from './src/models/venta.model.js';

const app = express();

// --- CONFIGURACIÓN DE PUG ---
app.set('view engine', 'pug');
app.set('views', './src/views');

// --- MIDDLEWARES GLOBALES ---
app.use(registrarPeticion);      // 1. Logger: registra cada request
app.use(express.json());         // 2. Parseo de JSON en el body
app.use(express.urlencoded({ extended: false })); // 3. Parseo de formularios HTML (POST de login)
app.use(validarJson);            // 4. Captura JSON malformado

// ─────────────────────────────────────────────────────────────────────────────
// RUTAS PÚBLICAS (sin autenticación)
// ─────────────────────────────────────────────────────────────────────────────

// Mostrar formulario de login
app.get('/login', (req, res) => res.render('login'));

// Procesar credenciales del formulario POST
// verificarLogin NO se aplica aquí — es la ruta pública de autenticación
app.post('/login', procesarLogin);

// Cerrar sesión
app.get('/logout', procesarLogout);

// ─────────────────────────────────────────────────────────────────────────────
// RUTAS PROTEGIDAS DE VISTAS WEB (requieren login)
// ─────────────────────────────────────────────────────────────────────────────

app.get('/', verificarLogin, (req, res) => {
  res.render('index');
});

app.get('/productos', verificarLogin, async (req, res) => {
  const productos = await ProductoModel.obtenerTodos();
  res.render('productos', { productos });
});

app.get('/proveedores', verificarLogin, async (req, res) => {
  const proveedores = await ProveedorModel.obtenerTodos();
  res.render('proveedores', { proveedores });
});

app.get('/clientes', verificarLogin, async (req, res) => {
  const clientes = await ClienteModel.obtenerTodos();
  res.render('clientes', { clientes });
});

app.get('/ventas', verificarLogin, async (req, res) => {
  const ventas = await VentaModel.obtenerTodos();
  res.render('ventas', { ventas });
});

app.get('/resumen', verificarLogin, async (req, res) => {
  const resumen = await resumenController.calcularResumen();
  res.render('resumen', { resumen });
});

// ─────────────────────────────────────────────────────────────────────────────
// RUTAS DE LA API JSON (sin autenticación — se prueban con Postman)
// ─────────────────────────────────────────────────────────────────────────────
app.use('/api/productos',   productosRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/clientes',    clientesRoutes);
app.use('/api/ventas',      ventasRoutes);
app.use('/api/resumen',     resumenRoutes);
app.use('/api/auditoria',   auditoriaRoutes);

// --- 404 HANDLER ---
app.use((req, res) => {
  res.status(404).json({ error: `Ruta ${req.originalUrl} no encontrada` });
});

export default app;
