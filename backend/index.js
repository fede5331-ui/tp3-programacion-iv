import express from "express";
import cors from "cors";
import { conectarDB } from "./db.js";
import authRouter, { authConfig } from "./auth.js";
import vehiculosRouter from "./vehiculos.js";
import conductoresRouter from "./conductores.js";
import viajesRouter from "./viajes.js";

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

// Cada router queda bajo su prefijo
app.use("/auth", authRouter);
app.use("/vehiculos", vehiculosRouter);
app.use("/conductores", conductoresRouter);
app.use("/viajes", viajesRouter);

// 404: si ninguna ruta anterior coincidió, la URL no existe
app.use((req, res) => {
  res.status(404).json({ mensaje: "Ruta no encontrada" });
});

// 500: manejador de errores. Express lo usa cuando algo falla sin ser controlado
// (por ejemplo, la base de datos caída). Tiene 4 parámetros: así Express lo reconoce.
app.use((err, req, res, next) => {
  console.error(err); // el detalle técnico queda en la consola del servidor
  // Al cliente no le mostramos detalles internos, solo un mensaje general
  res.status(500).json({ mensaje: "Error interno del servidor" });
});

// Ponemos el servidor a escuchar peticiones
app.listen(port, () => {
  console.log(`La aplicación está funcionando en el puerto ${port}`);
});