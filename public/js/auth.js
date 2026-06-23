import { state } from './state.js';

export async function iniciarSesion() {
  try {
    const res = await fetch('/api/refresh', { method: 'POST' });
    if (!res.ok) {
      window.location.href = '/login';
      return;
    }
    const data = await res.json();
    state.accessToken = data.accessToken;
    state.rolActual = data.rol;
    setTimeout(renovarToken, 55 * 60 * 1000);
  } catch {
    window.location.href = '/login';
  }
}

export async function renovarToken() {
  try {
    const res = await fetch('/api/refresh', { method: 'POST' });
    if (!res.ok) {
      window.location.href = '/login';
      return;
    }
    const data = await res.json();
    state.accessToken = data.accessToken;
    setTimeout(renovarToken, 55 * 60 * 1000);
  } catch {
    window.location.href = '/login';
  }
}

export async function fetchAuth(url, opciones = {}) {
  const res = await fetch(url, {
    ...opciones,
    headers: {
      ...opciones.headers,
      Authorization: `Bearer ${state.accessToken}`,
      ...(opciones.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });

  if (res.status === 401) {
    window.location.href = '/login';
    return null;
  }

  return res;
}

export async function logout() {
  await fetch('/logout');
  window.location.href = '/login';
}
