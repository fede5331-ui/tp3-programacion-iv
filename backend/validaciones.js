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

// Validación de los datos de un conductor (se usa al crear y al modificar)
export const validarConductor = [
  body("nombre")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("El nombre es obligatorio (máx. 50 caracteres)"),
  body("apellido")
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage("El apellido es obligatorio (máx. 50 caracteres)"),
  body("numeroDocumento")
    .trim()
    .isNumeric({ no_symbols: true })
    .isLength({ min: 7, max: 9 })
    .withMessage("El documento debe tener entre 7 y 9 dígitos, sin puntos"),
  body("numeroLicencia")
    .trim()
    .isAlphanumeric()
    .isLength({ min: 5, max: 20 })
    .withMessage("La licencia debe tener entre 5 y 20 letras o números"),
  // Las fechas llegan como texto "AAAA-MM-DD"; strict rechaza fechas imposibles como 2026-02-31
  body("fechaAltaLicencia")
    .isISO8601({ strict: true })
    .withMessage("Fecha de alta inválida (formato AAAA-MM-DD)"),
  body("fechaVencimientoLicencia")
    .isISO8601({ strict: true })
    .withMessage("Fecha de vencimiento inválida (formato AAAA-MM-DD)")
    // Validación personalizada: compara con otro campo del body
    .custom((vencimiento, { req }) => {
      if (vencimiento <= req.body.fechaAltaLicencia) {
        throw new Error("El vencimiento debe ser posterior al alta de la licencia");
      }
      return true;
    }),
];

// Formato aceptado para fecha y hora: "2026-11-10T08:30" o "2026-11-10 08:30" (con segundos opcionales)
const FORMATO_FECHA_HORA = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?$/;

// Validación de los datos de un viaje (se usa al crear y al modificar)
export const validarViaje = [
  // Los ids deben ser enteros positivos. La existencia real se comprueba en la ruta, contra la base
  body("vehiculoId")
    .isInt({ min: 1 })
    .withMessage("vehiculoId debe ser un número entero mayor a 0"),
  body("conductorId")
    .isInt({ min: 1 })
    .withMessage("conductorId debe ser un número entero mayor a 0"),
  body("fechaSalida")
    .matches(FORMATO_FECHA_HORA)
    .withMessage("Fecha de salida inválida (formato AAAA-MM-DDTHH:MM)")
    .bail() // si el formato falla, no sigue con las reglas de abajo
    .isISO8601({ strict: true })
    .withMessage("La fecha de salida no existe en el calendario"),
  body("fechaLlegada")
    .matches(FORMATO_FECHA_HORA)
    .withMessage("Fecha de llegada inválida (formato AAAA-MM-DDTHH:MM)")
    .bail()
    .isISO8601({ strict: true })
    .withMessage("La fecha de llegada no existe en el calendario")
    .bail()
    // La llegada no puede ser anterior a la salida
    .custom((llegada, { req }) => {
      if (new Date(llegada) < new Date(req.body.fechaSalida)) {
        throw new Error("La llegada no puede ser anterior a la salida");
      }
      return true;
    }),
  body("origen")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("El origen es obligatorio (máx. 100 caracteres)"),
  body("destino")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("El destino es obligatorio (máx. 100 caracteres)"),
  body("kilometros")
    .isFloat({ gt: 0 })
    .withMessage("Los kilómetros deben ser un número mayor a 0"),
  // optional(): si no viene, no se valida. Es el único campo opcional
  body("observaciones")
    .optional({ values: "falsy" })
    .trim()
    .isLength({ max: 255 })
    .withMessage("Las observaciones admiten hasta 255 caracteres"),
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