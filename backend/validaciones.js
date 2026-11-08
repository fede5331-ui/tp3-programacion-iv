import { body, param, validationResult } from "express-validator";
import passport from "passport";

// Guardia de autenticación: usa la estrategia "jwt" de Passport.
// Si el token falta, es inválido o está vencido, responde 401 automáticamente.
// session: false porque usamos tokens en vez de sesiones del servidor.
export const validarAutenticacion = passport.authenticate("jwt", {
  session: false,
});

// Valida que el parámetro :id de la URL sea un entero mayor o igual a 1
export const validarId = param("id").isInt({ min: 1 });

// Validación de los datos de un vehículo (se usa al crear y al modificar)
export const validarVehiculo = [
  body("marca")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("La marca es obligatoria (máx. 50 caracteres)"),
  body("modelo")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("El modelo es obligatorio (máx. 50 caracteres)"),
  body("patente")
    .trim()
    .toUpperCase() // normalizamos: "ab123cd" se guarda como "AB123CD"
    // Formato argentino: nuevo (AB123CD) o anterior (ABC123)
    .matches(/^([A-Z]{2}\d{3}[A-Z]{2}|[A-Z]{3}\d{3})$/)
    .withMessage("Patente inválida (ej: AB123CD o ABC123)"),
  body("anio")
    .isInt({ min: 1950, max: new Date().getFullYear() + 1 })
    .withMessage("Año inválido"),
  body("capacidadCarga")
    .isFloat({ gt: 0 })
    .withMessage("La capacidad de carga debe ser un número mayor a 0"),
];

// Middleware que se ejecuta DESPUÉS de las validaciones.
// Si alguna falló, corta acá y responde 400 con la lista de errores.
// Si todo está bien, next() deja pasar a la siguiente función (el handler de la ruta).
export const verificarValidaciones = (req, res, next) => {
  const resultadoValidacion = validationResult(req);
  if (!resultadoValidacion.isEmpty()) {
    return res.status(400).json({
      mensaje: "Parámetros no válidos",
      errores: resultadoValidacion.array(),
    });
  }
  next();
};