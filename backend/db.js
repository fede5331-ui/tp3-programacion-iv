import mysql from "mysql2/promise";

// Variable que guarda la conexión. La exportamos para que otros archivos
// (vehiculos.js, conductores.js, etc.) puedan hacer consultas con "db.execute"
export let db = null;

// Función que abre la conexión con MySQL usando los datos del archivo .env
export async function conectarDB() {
  try {
    db = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_DATABASE,
    });
    console.log("Conectado a la base de datos");
  } catch (e) {
    // Si falla la conexión (contraseña mal, MySQL apagado), mostramos el motivo y cortamos
    console.error(e.message);
    process.exit(1);
  }
}