export function mostrarToast(mensaje, tipo = 'ok') {
  const toast = document.getElementById('toast');
  toast.textContent = mensaje;
  toast.className = `toast ${tipo} show`;
  setTimeout(() => toast.classList.remove('show'), 3500);
}
