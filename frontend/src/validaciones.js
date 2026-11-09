// Funciones de validación reutilizables para los formularios.
// Cada una devuelve true si el dato es válido.

// Formato básico de email: algo@dominio.ext
export const esEmailValido = (valor) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());

// Contraseña: al menos 8 caracteres y al menos un número (igual que en el backend)
export const esPasswordValida = (valor) =>
  valor.length >= 8 && /\d/.test(valor);

// Campo de texto obligatorio con largo máximo
export const esTextoValido = (valor, max) =>
  valor.trim().length >= 1 && valor.trim().length <= max;