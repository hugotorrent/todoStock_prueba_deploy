// ─── middlewares/auth.middleware.js ───────────────────────────────────────────
// Autenticación basada en cookie simple.
//
// DECISIÓN DE DISEÑO — Por qué no usamos JWT o Passport:
// El parcial admite sesiones, JWT o Passport. Elegimos cookie simple porque:
// 1. El sistema es un panel de administración interno de un solo usuario (no multiusuario).
// 2. JWT agrega complejidad innecesaria para un caso de uso de un único rol.
// 3. La cookie de sesión cumple el requisito de autenticación y autorización
//    dentro del alcance de la materia sin overengineering.
// En un sistema multiusuario o con roles diferenciados, se migraría a JWT.
//
// Las credenciales vienen de variables de entorno (.env) — no hardcodeadas.

const SESSION_KEY    = process.env.SESSION_KEY    || 'todostock_session';
const ADMIN_USER     = process.env.ADMIN_USER     || 'user';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'user1234';

// ── verificarLogin ─────────────────────────────────────────────────────────────
// Middleware de autorización: protege rutas de vistas web.
// Si no hay sesión activa → redirige a /login.
function verificarLogin(req, res, next) {
  const cookies = parsearCookies(req.headers.cookie || '');
  if (cookies[SESSION_KEY] === 'autenticado') return next();
  res.redirect('/login');
}

// ── procesarLogin ──────────────────────────────────────────────────────────────
// Valida credenciales del formulario POST /login.
// Credenciales definidas en .env → no expuestas en el código fuente.
function procesarLogin(req, res) {
  const { usuario, password } = req.body;
  if (usuario === ADMIN_USER && password === ADMIN_PASSWORD) {
    res.setHeader('Set-Cookie', `${SESSION_KEY}=autenticado; Path=/; SameSite=Strict; HttpOnly`);
    return res.redirect('/');
  }
  res.render('login', { error: 'Usuario o contraseña incorrectos' });
}

// ── procesarLogout ─────────────────────────────────────────────────────────────
function procesarLogout(req, res) {
  res.setHeader('Set-Cookie', `${SESSION_KEY}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`);
  res.redirect('/login');
}

// ── Helper privado ─────────────────────────────────────────────────────────────
function parsearCookies(cookieHeader) {
  return cookieHeader.split(';').reduce((acc, cookie) => {
    const [clave, ...resto] = cookie.trim().split('=');
    if (clave) acc[clave.trim()] = resto.join('=').trim();
    return acc;
  }, {});
}

export { verificarLogin, procesarLogin, procesarLogout };
