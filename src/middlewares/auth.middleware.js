// ─── middlewares/auth.middleware.js ───────────────────────────────────────────
// Autenticación con JWT (access token) + refresh token en cookie HttpOnly.
// Dos roles: admin y empleado — credenciales desde .env.
//
// Flujo:
//   POST /login  → genera accessToken (JWT, 1h) + refreshToken (cookie, 7d)
//   GET  rutas   → verificarLogin lee el Bearer token del header Authorization
//   POST /api/refresh → renueva el accessToken con el refreshToken
//   GET  /logout → invalida la cookie del refreshToken

import jwt from 'jsonwebtoken';

const JWT_SECRET      = process.env.JWT_SECRET      || 'dev_secret_cambiar';
const JWT_EXPIRES     = process.env.JWT_EXPIRES     || '1h';
const REFRESH_SECRET  = process.env.REFRESH_SECRET  || 'dev_refresh_cambiar';
const REFRESH_EXPIRES = process.env.REFRESH_EXPIRES || '7d';

const ADMIN_USER        = process.env.ADMIN_USER        || 'user';
const ADMIN_PASSWORD    = process.env.ADMIN_PASSWORD    || 'user1234';
const EMPLEADO_USER     = process.env.EMPLEADO_USER     || 'empleado';
const EMPLEADO_PASSWORD = process.env.EMPLEADO_PASSWORD || 'emp1234';
const SESSION_KEY       = process.env.SESSION_KEY       || 'todostock_session';

// ── Helpers ───────────────────────────────────────────────────────────────────

// Genera un accessToken JWT con el rol embebido
function generarAccessToken(rol) {
  return jwt.sign({ rol }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

// Genera un refreshToken de larga duración
function generarRefreshToken(rol) {
  return jwt.sign({ rol }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
}

// Parsea cookies del header (para leer el refreshToken)
function parsearCookies(cookieHeader = '') {
  return cookieHeader.split(';').reduce((acc, c) => {
    const [k, ...v] = c.trim().split('=');
    if (k) acc[k.trim()] = v.join('=').trim();
    return acc;
  }, {});
}

// ── verificarLogin ─────────────────────────────────────────────────────────────
// Lee el JWT del header Authorization: Bearer <token>
// También acepta la cookie de sesión legacy para compatibilidad con las vistas Pug
function verificarLogin(req, res, next) {
  // 1. Intentar leer el Bearer token del header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.rol = payload.rol;
      return next();
    } catch (err) {
      // Token expirado o inválido — no hacer nada, probar cookie
    }
  }

  // 2. Fallback: leer cookie de sesión legacy (para vistas Pug)
  const cookies = parsearCookies(req.headers.cookie);
  const session = cookies[SESSION_KEY];
  if (session === 'admin' || session === 'empleado') {
    req.rol = session;
    return next();
  }

  // 3. Sin autenticación → redirigir o 401
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'No autenticado. Token requerido.' });
  }
  res.redirect('/login');
}

// ── soloAdmin ──────────────────────────────────────────────────────────────────
function soloAdmin(req, res, next) {
  // Primero verificar que haya sesión
  const authHeader = req.headers.authorization;
  let rol = null;

  if (authHeader?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(authHeader.slice(7), JWT_SECRET);
      rol = payload.rol;
    } catch {}
  }

  if (!rol) {
    const cookies = parsearCookies(req.headers.cookie);
    const session = cookies[SESSION_KEY];
    if (session === 'admin' || session === 'empleado') rol = session;
  }

  if (rol === 'admin') { req.rol = 'admin'; return next(); }
  if (rol === 'empleado') return res.redirect('/?acceso=denegado');
  res.redirect('/login');
}

// ── procesarLogin ──────────────────────────────────────────────────────────────
// Valida credenciales y devuelve accessToken + establece refreshToken en cookie
function procesarLogin(req, res) {
  const { usuario, password } = req.body;

  let rol = null;
  if (usuario === ADMIN_USER     && password === ADMIN_PASSWORD)     rol = 'admin';
  if (usuario === EMPLEADO_USER  && password === EMPLEADO_PASSWORD)  rol = 'empleado';

  if (!rol) {
    // Si es una petición JSON (fetch del frontend) → responder con error
    if (req.headers['content-type']?.includes('application/json')) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    // Si es un form HTML → renderizar login con error
    return res.render('login', { error: 'Usuario o contraseña incorrectos' });
  }

  // Generar tokens
  const accessToken  = generarAccessToken(rol);
  const refreshToken = generarRefreshToken(rol);

  // Establecer cookie de sesión legacy (para vistas Pug)
  res.setHeader('Set-Cookie', [
    `${SESSION_KEY}=${rol}; Path=/; SameSite=Strict; HttpOnly`,
    `refreshToken=${refreshToken}; Path=/; SameSite=Strict; HttpOnly; Max-Age=${7 * 24 * 3600}`,
  ]);

  // Si es fetch JSON → responder con el accessToken
  if (req.headers['content-type']?.includes('application/json')) {
    return res.json({ accessToken, rol });
  }

  // Si es form HTML → redirigir al panel
  res.redirect('/');
}

// ── procesarRefresh ────────────────────────────────────────────────────────────
// Renueva el accessToken usando el refreshToken de la cookie
function procesarRefresh(req, res) {
  const cookies      = parsearCookies(req.headers.cookie);
  const refreshToken = cookies['refreshToken'];

  if (!refreshToken) {
    return res.status(401).json({ error: 'Sin refresh token' });
  }

  try {
    const payload    = jwt.verify(refreshToken, REFRESH_SECRET);
    const accessToken= generarAccessToken(payload.rol);
    res.json({ accessToken, rol: payload.rol });
  } catch {
    res.status(401).json({ error: 'Refresh token expirado o inválido' });
  }
}

// ── procesarLogout ─────────────────────────────────────────────────────────────
function procesarLogout(req, res) {
  res.setHeader('Set-Cookie', [
    `${SESSION_KEY}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
    `refreshToken=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`,
  ]);
  res.redirect('/login');
}

export {
  verificarLogin, soloAdmin,
  procesarLogin, procesarRefresh, procesarLogout
};