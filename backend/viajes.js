import express from "express";
import { query } from "express-validator";
import { db } from "./db.js";
import {
  validarAutenticacion,
  validarId,
  validarViaje,
  verificarValidaciones,
} from "./validaciones.js";

const router = express.Router();

// Consulta base: trae el viaje junto con datos legibles del vehículo y del conductor (JOIN).
// Las fechas salen como "AAAA-MM-DDTHH:MM", el formato que usan los inputs de fecha y hora del frontend.
// CAST(... AS DOUBLE) hace que los kilómetros lleguen como número y no como texto.
const SELECT_VIAJES = `
  SELECT v.id,
         v.vehiculo_id AS vehiculoId,
         v.conductor_id AS conductorId,
         DATE_FORMAT(v.fecha_salida, '%Y-%m-%dT%H:%i') AS fechaSalida,
         DATE_FORMAT(v.fecha_llegada, '%Y-%m-%dT%H:%i') AS fechaLlegada,
         v.origen,
         v.destino,
         CAST(v.kilometros AS DOUBLE) AS kilometros,
         v.observaciones,
         CONCAT(ve.marca, ' ', ve.modelo) AS vehiculo,
         ve.patente,
         CONCAT(c.apellido, ', ', c.nombre) AS conductor
  FROM viajes v
  JOIN vehiculos ve ON v.vehiculo_id = ve.id
  JOIN conductores c ON v.conductor_id = c.id`;

// Validación de los filtros opcionales de la URL (se usan en el listado y en el total de km)
const validarFiltrosViajes = [
  query("vehiculoId").optional().isInt({ min: 1 }),
  query("conductorId").optional().isInt({ min: 1 }),
];

// Comprueba que el vehículo y el conductor existan y que la licencia no esté vencida
// a la fecha de salida. Devuelve un mensaje de error, o null si todo está bien.
async function verificarReferencias({ vehiculoId, conductorId, fechaSalida }) {
  const [vehiculos] = await db.execute("SELECT id FROM vehiculos WHERE id = ?", [vehiculoId]);
  if (vehiculos.length === 0) {
    return "El vehículo indicado no existe";
  }

  const [conductores] = await db.execute(
    "SELECT DATE_FORMAT(fecha_vencimiento_licencia, '%Y-%m-%d') AS vencimiento FROM conductores WHERE id = ?",
    [conductorId],
  );
  if (conductores.length === 0) {
    return "El conductor indicado no existe";
  }

  // Comparamos solo la parte de la fecha ("AAAA-MM-DD") de la salida
  if (conductores[0].vencimiento < fechaSalida.slice(0, 10)) {
    return "La licencia del conductor estaba vencida en la fecha de salida";
  }

  return null;
}

// GET /viajes -> historial. Filtros opcionales: ?vehiculoId=1 y/o ?conductorId=2
router.get(
  "/",
  validarAutenticacion,
  validarFiltrosViajes,
  verificarValidaciones,
  async (req, res) => {
    const filtros = [];
    const parametros = [];
    const { vehiculoId, conductorId } = req.query;

    if (vehiculoId) {
      filtros.push("v.vehiculo_id = ?");
      parametros.push(Number(vehiculoId));
    }
    if (conductorId) {
      filtros.push("v.conductor_id = ?");
      parametros.push(Number(conductorId));
    }

    let sql = SELECT_VIAJES;
    if (filtros.length > 0) {
      sql += " WHERE " + filtros.join(" AND ");
    }
    // Los más recientes primero
    sql += " ORDER BY v.fecha_salida DESC";

    const [viajes] = await db.execute(sql, parametros);
    res.json(viajes);
  },
);

// GET /viajes/kilometros -> total de km y cantidad de viajes de un vehículo o conductor
// IMPORTANTE: esta ruta va ANTES de "/:id", si no Express tomaría "kilometros" como un id
router.get(
  "/kilometros",
  validarAutenticacion,
  validarFiltrosViajes,
  verificarValidaciones,
  async (req, res) => {
    const filtros = [];
    const parametros = [];
    const { vehiculoId, conductorId } = req.query;

    if (vehiculoId) {
      filtros.push("vehiculo_id = ?");
      parametros.push(Number(vehiculoId));
    }
    if (conductorId) {
      filtros.push("conductor_id = ?");
      parametros.push(Number(conductorId));
    }

    let sql =
      "SELECT CAST(COALESCE(SUM(kilometros), 0) AS DOUBLE) AS totalKilometros, COUNT(*) AS cantidadViajes FROM viajes";
    if (filtros.length > 0) {
      sql += " WHERE " + filtros.join(" AND ");
    }

    const [resultado] = await db.execute(sql, parametros);
    res.json(resultado[0]);
  },
);

// GET /viajes/:id -> devuelve un viaje
router.get(
  "/:id",
  validarAutenticacion,
  validarId,
  verificarValidaciones,
  async (req, res) => {
    const id = Number(req.params.id);

    const [viajes] = await db.execute(SELECT_VIAJES + " WHERE v.id = ?", [id]);
    if (viajes.length === 0) {
      return res.status(404).json({ mensaje: "Viaje no encontrado" });
    }

    res.json(viajes[0]);
  },
);

// POST /viajes -> registra un viaje
router.post(
  "/",
  validarAutenticacion,
  validarViaje,
  verificarValidaciones,
  async (req, res) => {
    const { vehiculoId, conductorId, fechaSalida, fechaLlegada, origen, destino, kilometros, observaciones } = req.body;

    const error = await verificarReferencias({ vehiculoId, conductorId, fechaSalida });
    if (error) {
      return res.status(400).json({ mensaje: error });
    }

    // MySQL espera "AAAA-MM-DD HH:MM", cambiamos la "T" por un espacio
    const [result] = await db.execute(
      "INSERT INTO viajes (vehiculo_id, conductor_id, fecha_salida, fecha_llegada, origen, destino, kilometros, observaciones) VALUES (?,?,?,?,?,?,?,?)",
      [
        vehiculoId,
        conductorId,
        fechaSalida.replace("T", " "),
        fechaLlegada.replace("T", " "),
        origen,
        destino,
        kilometros,
        observaciones || null, // si no viene, guardamos NULL
      ],
    );

    res.status(201).json({
      id: result.insertId,
      vehiculoId,
      conductorId,
      fechaSalida,
      fechaLlegada,
      origen,
      destino,
      kilometros,
      observaciones: observaciones || null,
    });
  },
);

// PUT /viajes/:id -> modifica un viaje existente
router.put(
  "/:id",
  validarAutenticacion,
  validarId,
  validarViaje,
  verificarValidaciones,
  async (req, res) => {
    const id = Number(req.params.id);
    const { vehiculoId, conductorId, fechaSalida, fechaLlegada, origen, destino, kilometros, observaciones } = req.body;

    const [actual] = await db.execute("SELECT id FROM viajes WHERE id = ?", [id]);
    if (actual.length === 0) {
      return res.status(404).json({ mensaje: "Viaje no encontrado" });
    }

    const error = await verificarReferencias({ vehiculoId, conductorId, fechaSalida });
    if (error) {
      return res.status(400).json({ mensaje: error });
    }

    await db.execute(
      "UPDATE viajes SET vehiculo_id=?, conductor_id=?, fecha_salida=?, fecha_llegada=?, origen=?, destino=?, kilometros=?, observaciones=? WHERE id=?",
      [
        vehiculoId,
        conductorId,
        fechaSalida.replace("T", " "),
        fechaLlegada.replace("T", " "),
        origen,
        destino,
        kilometros,
        observaciones || null,
        id,
      ],
    );

    res.json({
      id,
      vehiculoId,
      conductorId,
      fechaSalida,
      fechaLlegada,
      origen,
      destino,
      kilometros,
      observaciones: observaciones || null,
    });
  },
);

// DELETE /viajes/:id -> elimina un viaje
router.delete(
  "/:id",
  validarAutenticacion,
  validarId,
  verificarValidaciones,
  async (req, res) => {
    const id = Number(req.params.id);

    const [actual] = await db.execute("SELECT id FROM viajes WHERE id = ?", [id]);
    if (actual.length === 0) {
      return res.status(404).json({ mensaje: "Viaje no encontrado" });
    }

    await db.execute("DELETE FROM viajes WHERE id = ?", [id]);
    res.status(204).send();
  },
);

export default router;