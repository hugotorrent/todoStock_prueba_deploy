# TodoStock S.A. — Backend REST

Sistema de gestión para distribuidora mayorista de artículos de limpieza.
**DHL Solutions — Grupo N°9 | Ingeniería de Software 2°D | IFTS N°29**

---

## Tecnologías

| Tecnología | Versión | Uso |
|---|---|---|
| Node.js | ≥18.0 | Entorno de ejecución — ES6 modules |
| Express | 4.18.x | Framework HTTP |
| MongoDB / Atlas | 7.x | Base de datos NoSQL |
| Mongoose | 8.0.x | ODM — Schemas, validaciones, async/await |
| Pug | 3.0.x | Motor de plantillas — vistas web |
| dotenv | 16.x | Variables de entorno |
| Nodemon | 3.1.x | Reinicio automático en desarrollo |

---

## Instalación y uso local

```bash
# 1. Clonar el repositorio
git clone <URL_DEL_REPO>
cd todostock-backend

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus valores (ver sección Variables de entorno)

# 4. Cargar datos iniciales en MongoDB
npm run seed

# 5. Iniciar en desarrollo
npm run dev

# 6. Iniciar en producción
npm start
```

El servidor corre en `http://localhost:3000`

---

## Variables de entorno

Crear un archivo `.env` en la raíz basándose en `.env.example`:

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/todostock
SESSION_KEY=todostock_session
ADMIN_USER=user
ADMIN_PASSWORD=user1234
NODE_ENV=development
```

Para producción con Mongo Atlas reemplazar `MONGO_URI` con la URI del cluster.

---

## Panel web

| Ruta | Descripción | Requiere login |
|---|---|---|
| `/login` | Formulario de acceso | No |
| `/` | Panel principal | Sí |
| `/proveedores` | Lista de proveedores | Sí |
| `/productos` | Lista con alertas de stock | Sí |
| `/clientes` | Lista con deuda actual | Sí |
| `/ventas` | Historial de ventas | Sí |
| `/resumen` | Dashboard DSS con alertas | Sí |

**Credenciales:** usuario `user` / contraseña `user1234`  
*(configurables en `.env`)*

---

## API REST

Todos los endpoints `/api/*` responden JSON y no requieren autenticación.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/proveedores` | Listar todos |
| POST | `/api/proveedores` | Crear (valida CUIT único) |
| GET | `/api/proveedores/:id` | Obtener uno |
| PUT | `/api/proveedores/:id` | Actualizar |
| DELETE | `/api/proveedores/:id` | Desactivar (baja lógica) |
| GET | `/api/productos` | Listar con alertas de stock |
| POST | `/api/productos` | Crear (valida proveedorId) |
| GET | `/api/productos/:id` | Obtener uno |
| PUT | `/api/productos/:id` | Actualizar |
| DELETE | `/api/productos/:id` | Desactivar |
| GET | `/api/clientes` | Listar todos |
| POST | `/api/clientes` | Crear |
| GET | `/api/clientes/:id` | Obtener uno |
| GET | `/api/clientes/:id/credito` | Consultar crédito `?monto=N` |
| POST | `/api/clientes/:id/pagos` | Registrar pago de deuda |
| PUT | `/api/clientes/:id` | Actualizar |
| DELETE | `/api/clientes/:id` | Desactivar (bloquea con deuda) |
| GET | `/api/ventas` | Listar con populate() |
| POST | `/api/ventas` | Crear (valida stock y crédito) |
| GET | `/api/ventas/:id` | Obtener una venta |
| DELETE | `/api/ventas/:id` | Cancelar (revierte stock y deuda) |
| GET | `/api/resumen` | Dashboard DSS con Promise.all |
| GET | `/api/auditoria` | Log de operaciones |

---

## Despliegue en la nube

### Mongo Atlas
1. Crear cuenta en [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Crear cluster gratuito (M0)
3. En **Database Access** → crear usuario con contraseña
4. En **Network Access** → agregar `0.0.0.0/0` (acceso desde cualquier IP)
5. En **Connect** → copiar la URI de conexión
6. Reemplazar `MONGO_URI` en `.env` o en las variables de entorno de Railway/Render

### Railway
1. Crear cuenta en [railway.app](https://railway.app)
2. New Project → Deploy from GitHub repo
3. En **Variables** → agregar todas las del `.env`
4. Railway asigna el `PORT` automáticamente

### Render
1. Crear cuenta en [render.com](https://render.com)
2. New Web Service → conectar repositorio GitHub
3. Build Command: `npm install`
4. Start Command: `npm start`
5. Agregar variables de entorno en el panel

---

## Estructura del proyecto

```
todostock-backend/
├── server.js              ← carga .env, conecta DB, inicia Express
├── app.js                 ← middlewares, rutas web y API
├── .env.example           ← plantilla de variables de entorno
├── .gitignore             ← excluye .env y node_modules
├── package.json
├── README.md
├── tools/
│   ├── seed.js            ← carga datos iniciales (npm run seed)
│   └── postman-todostock.json
└── src/
    ├── db/conexion.js
    ├── schemas/
    ├── models/
    ├── controllers/
    ├── routes/
    ├── middlewares/
    └── views/
```

---

## Integrantes

| Nombre | Rol |
|---|---|
| Diego González | Arquitectura, schemas, modelos Proveedores y Productos, seed.js |
| Luciano Reguera | Modelos Clientes y Ventas, control crediticio, cancelar() |
| Hugo Torrent | Middlewares, auth, dashboard DSS, vistas Pug, documentación |
