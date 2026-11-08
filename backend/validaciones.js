import { param, validationResult } from "express-validator";
import passport from "passport";

// Guardia de autenticación: usa la estrategia "jwt" de Passport.
// Si el token falta, es inválido o está vencido, responde 401 automáticamente.
// session: false porque usamos tokens en vez de sesiones del servidor.
export const validarAutenticacion = passport.authenticate("jwt", {
  session: false,
});

// Valida que el parámetro :id de la URL sea un entero mayor o igual a 1
export const validarId = param("id").isInt({ min: 1 });

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