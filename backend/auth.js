import express from "express";
import { body } from "express-validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { db } from "./db.js";
import { verificarValidaciones } from "./validaciones.js";

const router = express.Router();

// Configura Passport: de dónde sacar el token y con qué clave verificarlo
export function authConfig() {
  const jwtOptions = {
    // El token viaja en el encabezado: Authorization: Bearer <token>
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    // Clave secreta del .env con la que se firmó el token
    secretOrKey: process.env.JWT_SECRET,
  };

  passport.use(
    new Strategy(jwtOptions, async (payload, next) => {
      // Si llegamos acá, el token es válido y no está vencido.
      // "payload" son los datos que guardamos al crear el token.
      // Se guardan en req.user para que las rutas protegidas los puedan usar.
      next(null, payload);
    }),
  );
}

// POST /auth/registro -> crea un usuario nuevo
router.post(
  "/registro",
  [
    body("nombre").trim().isLength({ min: 1, max: 100 }).withMessage("Nombre obligatorio (máx. 100 caracteres)"),
    body("email").trim().isEmail().withMessage("Email con formato inválido").isLength({ max: 100 }),
    body("password")
      .isStrongPassword({
        minLength: 8, // mínimo 8 caracteres
        minLowercase: 1, // al menos una minúscula
        minUppercase: 0,
        minNumbers: 1, // al menos un número
        minSymbols: 0,
      })
      .withMessage("La contraseña debe tener al menos 8 caracteres y un número"),
  ],
  verificarValidaciones,
  async (req, res) => {
    const { nombre, email, password } = req.body;

    // Verificamos que el email no esté ya registrado
    const [existentes] = await db.execute(
      "SELECT id FROM usuarios WHERE email = ?",
      [email],
    );
    if (existentes.length > 0) {
      return res.status(400).json({ mensaje: "El email ya está registrado" });
    }

    // Encriptamos la contraseña: en la base NUNCA se guarda el texto original.
    // El 12 es el "costo": cuánto trabajo hace bcrypt (más alto = más seguro pero más lento)
    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await db.execute(
      "INSERT INTO usuarios (nombre, email, password) VALUES (?,?,?)",
      [nombre, email, hashedPassword],
    );

    // Respondemos 201 (creado) y NO devolvemos la contraseña
    res.status(201).json({ id: result.insertId, nombre, email });
  },
);

// POST /auth/login -> verifica credenciales y devuelve un token
router.post(
  "/login",
  [
    body("email").trim().isEmail().withMessage("Email con formato inválido"),
    body("password").notEmpty().withMessage("La contraseña es obligatoria"),
  ],
  verificarValidaciones,
  async (req, res) => {
    const { email, password } = req.body;

    const [usuarios] = await db.execute(
      "SELECT * FROM usuarios WHERE email = ?",
      [email],
    );

    // Mismo mensaje si falla el email o la contraseña: así no le damos pistas a un atacante
    if (usuarios.length === 0) {
      return res.status(401).json({ mensaje: "Credenciales inválidas" });
    }

    // Comparamos la contraseña ingresada con el hash guardado
    const passwordOk = await bcrypt.compare(password, usuarios[0].password);
    if (!passwordOk) {
      return res.status(401).json({ mensaje: "Credenciales inválidas" });
    }

    // Datos que viajan dentro del token (nunca poner la contraseña acá)
    const payload = { userId: usuarios[0].id };

    // Firmamos el token con la clave secreta. Expira a las 4 horas (requisito del PDF)
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "4h",
    });

    res.json({ token, nombre: usuarios[0].nombre, email: usuarios[0].email });
  },
);

export default router;