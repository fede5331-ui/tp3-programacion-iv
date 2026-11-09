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

// Patente argentina: formato nuevo (AB123CD) o anterior (ABC123)
export const esPatenteValida = (valor) =>
  /^([A-Z]{2}\d{3}[A-Z]{2}|[A-Z]{3}\d{3})$/.test(valor.trim().toUpperCase());

// Número entero dentro de un rango (acepta texto numérico del input)
export const esEnteroEnRango = (valor, min, max) => {
  const n = Number(valor);
  return valor !== "" && Number.isInteger(n) && n >= min && n <= max;
};

// Número mayor a 0 (acepta decimales)
export const esNumeroPositivo = (valor) =>
  valor !== "" && !Number.isNaN(Number(valor)) && Number(valor) > 0;