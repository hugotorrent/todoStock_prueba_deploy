// ─── middlewares/auth.middleware.js ───────────────────────────────────────────
// Autenticación con dos roles: admin y empleado.
// Las credenciales vienen del .env — no hardcodeadas en el código.
//
// DECISIÓN: cookie simple en lugar de JWT porque el sistema tiene
// dos usuarios fijos con roles predefinidos. JWT agrega complejidad
// innecesaria para este alcance. Si escalara a usuarios dinámicos
// se migraría a JWT con refresh tokens.

const SESSION_KEY       = process.env.SESSION_KEY       || 'todostock_session';
const ADMIN_USER        = process.env.ADMIN_USER        || 'user';
const ADMIN_PASSWORD    = process.env.ADMIN_PASSWORD    || 'user1234';
const EMPLEADO_USER     = process.env.EMPLEADO_USER     || 'empleado';
const EMPLEADO_PASSWORD = process.env.EMPLEADO_PASSWORD || 'emp1234';

function parsearCookies(cookieHeader) {
  return cookieHeader.split(';').reduce((acc, cookie) => {
    const [clave, ...resto] = cookie.trim().split('=');
    if (clave) acc[clave.trim()] = resto.join('=').trim();
    return acc;
  }, {});
}

function obtenerRol(req) {
  const cookies = parsearCookies(req.headers.cookie || '');
  const session = cookies[SESSION_KEY];
  if (session === 'admin')    return 'admin';
  if (session === 'empleado') return 'empleado';
  return null;
}

// Protege cualquier ruta — redirige a /login si no hay sesión
function verificarLogin(req, res, next) {
  const rol = obtenerRol(req);
  if (rol) { req.rol = rol; return next(); }
  res.redirect('/login');
}

// Solo administradores — empleados son redirigidos al inicio
function soloAdmin(req, res, next) {
  const rol = obtenerRol(req);
  if (rol === 'admin')    { req.rol = 'admin'; return next(); }
  if (rol === 'empleado') return res.redirect('/?acceso=denegado');
  res.redirect('/login');
}

// Valida credenciales y establece cookie con el rol
function procesarLogin(req, res) {
  const { usuario, password } = req.body;
  if (usuario === ADMIN_USER && password === ADMIN_PASSWORD) {
    res.setHeader('Set-Cookie', `${SESSION_KEY}=admin; Path=/; SameSite=Strict; HttpOnly`);
    return res.redirect('/');
  }
  if (usuario === EMPLEADO_USER && password === EMPLEADO_PASSWORD) {
    res.setHeader('Set-Cookie', `${SESSION_KEY}=empleado; Path=/; SameSite=Strict; HttpOnly`);
    return res.redirect('/');
  }
  res.render('login', { error: 'Usuario o contraseña incorrectos' });
}

function procesarLogout(req, res) {
  res.setHeader('Set-Cookie', `${SESSION_KEY}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
  res.redirect('/login');
}

export { verificarLogin, soloAdmin, procesarLogin, procesarLogout, obtenerRol };
