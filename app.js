// ─── app.js ───────────────────────────────────────────────────────────────────
import 'dotenv/config';
import express from 'express';
import path    from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Rutas API
import productosRoutes   from './src/routes/productos.routes.js';
import proveedoresRoutes from './src/routes/proveedores.routes.js';
import clientesRoutes    from './src/routes/clientes.routes.js';
import ventasRoutes      from './src/routes/ventas.routes.js';
import resumenRoutes     from './src/routes/resumen.routes.js';
import auditoriaRoutes   from './src/routes/auditoria.routes.js';

// Middlewares
import { registrarPeticion } from './src/middlewares/logger.middleware.js';
import validarJson           from './src/middlewares/validarJson.middleware.js';
import {
  verificarLogin, soloAdmin,
  procesarLogin,  procesarLogout
} from './src/middlewares/auth.middleware.js';

// Modelos para vistas Pug (login sigue siendo Pug)
import ProveedorModel    from './src/models/proveedor.model.js';
import ProductoModel     from './src/models/producto.model.js';
import ClienteModel      from './src/models/cliente.model.js';
import VentaModel        from './src/models/venta.model.js';
import resumenController from './src/controllers/resumen.controller.js';

const app = express();

// Motor de vistas Pug (solo para login)
app.set('view engine', 'pug');
app.set('views', './src/views');

// ── MIDDLEWARES GLOBALES ──────────────────────────────────────────────────────
app.use(registrarPeticion);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(validarJson);

// ── ARCHIVOS ESTÁTICOS — carpeta public/ (frontend Vanilla JS) ────────────────
// Express sirve index.html, style.css y app.js del cliente desde acá
app.use(express.static(path.join(__dirname, 'public')));

// ── RUTAS PÚBLICAS ────────────────────────────────────────────────────────────
app.get('/login', (req, res) => res.render('login'));
app.post('/login', procesarLogin);
app.get('/logout', procesarLogout);

// ── ENDPOINT /api/me — devuelve el rol de la cookie al frontend JS ────────────
app.get('/api/me', verificarLogin, (req, res) => {
  res.json({ rol: req.rol });
});

// ── RUTA PRINCIPAL — sirve el index.html del frontend Vanilla JS ──────────────
// Ya no usa Pug — el frontend JS maneja toda la navegación del panel
app.get('/', verificarLogin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── RUTAS PUG LEGACY — mantenidas por compatibilidad ─────────────────────────
// Estas rutas siguen funcionando pero el frontend JS las reemplaza
app.get('/productos', verificarLogin, async (req, res) => {
  const productos = await ProductoModel.obtenerTodos();
  res.render('productos', { productos, rol: req.rol });
});

app.get('/clientes', verificarLogin, async (req, res) => {
  const clientes = await ClienteModel.obtenerTodos();
  res.render('clientes', { clientes, rol: req.rol });
});

app.get('/ventas', verificarLogin, async (req, res) => {
  const ventas = await VentaModel.obtenerTodos();
  res.render('ventas', { ventas, rol: req.rol });
});

app.get('/proveedores', soloAdmin, async (req, res) => {
  const proveedores = await ProveedorModel.obtenerTodos();
  res.render('proveedores', { proveedores, rol: req.rol });
});

app.get('/resumen', soloAdmin, async (req, res) => {
  const datos = await resumenController.calcularResumen();
  res.render('resumen', { datos, rol: req.rol });
});

app.get('/auditoria', soloAdmin, async (req, res) => {
  res.render('auditoria', { rol: req.rol });
});

// ── RUTAS API (sin autenticación — para Postman) ──────────────────────────────
app.use('/api/productos',   productosRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/clientes',    clientesRoutes);
app.use('/api/ventas',      ventasRoutes);
app.use('/api/resumen',     resumenRoutes);
app.use('/api/auditoria',   auditoriaRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Ruta ${req.originalUrl} no encontrada` });
});

export default app;