// ─── app.js ───────────────────────────────────────────────────────────────────
import 'dotenv/config';
import express from 'express';

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

// Modelos para vistas Pug
import ProductoModel  from './src/models/producto.model.js';
import ProveedorModel from './src/models/proveedor.model.js';
import ClienteModel   from './src/models/cliente.model.js';
import VentaModel     from './src/models/venta.model.js';
import resumenController from './src/controllers/resumen.controller.js';

const app = express();

// Motor de vistas
app.set('view engine', 'pug');
app.set('views', './src/views');

// Middlewares globales
app.use(registrarPeticion);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(validarJson);

// ── RUTAS PÚBLICAS ────────────────────────────────────────────────────────────
app.get('/login', (req, res) => res.render('login'));
app.post('/login', procesarLogin);
app.get('/logout', procesarLogout);

// -- endpoint para verificar si el usuario está logueado (usado por frontend)
app.get('/api/me', verificarLogin, (req, res) => {
  res.json({ rol: req.rol });
});

// ── RUTAS WEB — ADMIN Y EMPLEADO ──────────────────────────────────────────────

// Panel principal — muestra aviso si viene de acceso denegado
app.get('/', verificarLogin, (req, res) => {
  const accesoDenegado = req.query.acceso === 'denegado';
  res.render('index', { rol: req.rol, accesoDenegado });
});

// Productos — ambos roles pueden ver, solo admin puede modificar
app.get('/productos', verificarLogin, async (req, res) => {
  const productos = await ProductoModel.obtenerTodos();
  res.render('productos', { productos, rol: req.rol });
});

// Clientes — ambos roles pueden ver
app.get('/clientes', verificarLogin, async (req, res) => {
  const clientes = await ClienteModel.obtenerTodos();
  res.render('clientes', { clientes, rol: req.rol });
});

// Ventas — ambos roles pueden ver y registrar
app.get('/ventas', verificarLogin, async (req, res) => {
  const ventas = await VentaModel.obtenerTodos();
  res.render('ventas', { ventas, rol: req.rol });
});

// ── RUTAS WEB — SOLO ADMIN ────────────────────────────────────────────────────
app.get('/proveedores', soloAdmin, async (req, res) => {
  const proveedores = await ProveedorModel.obtenerTodos();
  res.render('proveedores', { proveedores, rol: req.rol });
});

app.get('/resumen', soloAdmin, async (req, res) => {
  // Reutilizamos la lógica del controller y pasamos los datos a Pug
  const datos = await resumenController.calcularResumen();
  res.render('resumen', { datos, rol: req.rol });
});

app.get('/auditoria', soloAdmin, async (req, res) => {
  res.render('auditoria', { rol: req.rol });
});


// -- Servir archivos estáticos (CSS, JS) desde la carpeta 'public'
app.use(express.static('public'));

// ── RUTAS API (sin autenticación — para Postman) ──────────────────────────────
app.use('/api/productos',   productosRoutes);
app.use('/api/proveedores', proveedoresRoutes);
app.use('/api/clientes',    clientesRoutes);
app.use('/api/ventas',      ventasRoutes);
app.use('/api/resumen',     resumenRoutes);
app.use('/api/auditoria',   auditoriaRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ error: `Ruta ${req.originalUrl} no encontrada` });
});

export default app;
