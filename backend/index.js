import express from "express";
import cors from "cors";
import { conectarDB } from "./db.js";
import authRouter, { authConfig } from "./auth.js";
import vehiculosRouter from "./vehiculos.js";

// Abrimos la conexión con la base de datos al iniciar
conectarDB();

// Creamos la aplicación Express y definimos el puerto
const app = express();
const port = 3000;

// Permite que el servidor entienda el body de las peticiones en formato JSON
app.use(express.json());

// Habilita CORS: sin esto el navegador bloquea las llamadas del frontend (otro puerto)
app.use(cors());

// Configura Passport para que pueda verificar tokens JWT
authConfig();

// Ruta de prueba para verificar que el servidor responde
app.get("/", (req, res) => {
  res.send("API de vehículos, conductores y viajes funcionando");
});

// Todas las rutas de auth.js quedan bajo el prefijo /auth
// (queda /auth/registro y /auth/login)
app.use("/auth", authRouter);

// Todas las rutas de vehiculos.js quedan bajo el prefijo /vehiculos
app.use("/vehiculos", vehiculosRouter);

// Ponemos el servidor a escuchar peticiones
app.listen(port, () => {
  console.log(`La aplicación está funcionando en el puerto ${port}`);
});