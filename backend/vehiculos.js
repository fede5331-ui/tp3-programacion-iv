import express from "express";
import { query } from "express-validator";
import { db } from "./db.js";
import {
  validarAutenticacion,
  validarId,
  validarVehiculo,
  verificarValidaciones,
} from "./validaciones.js";

const router = express.Router();

// GET /vehiculos -> lista todos los vehículos (opcional: ?marca=Ford&patente=AB)
router.get(
  "/",
  validarAutenticacion,
  [
    query("marca").optional().trim().isLength({ min: 1, max: 50 }),
    query("patente").optional().trim().isLength({ min: 1, max: 10 }),
  ],
  verificarValidaciones,
  async (req, res) => {
    const filtros = [];
    const parametros = [];
    const { marca, patente } = req.query;

    if (marca) {
      filtros.push("marca LIKE ?");
      parametros.push(`%${marca}%`);
    }
    if (patente) {
      filtros.push("patente LIKE ?");
      parametros.push(`%${patente}%`);
    }

    let sql =
      "SELECT id, marca, modelo, patente, anio, capacidad_carga AS capacidadCarga FROM vehiculos";
    if (filtros.length > 0) {
      sql += " WHERE " + filtros.join(" AND ");
    }

    const [vehiculos] = await db.execute(sql, parametros);
    res.json(vehiculos);
  },
);

// GET /vehiculos/:id -> devuelve un vehículo
router.get(
  "/:id",
  validarAutenticacion,
  validarId,
  verificarValidaciones,
  async (req, res) => {
    const id = Number(req.params.id);

    const [vehiculos] = await db.execute(
      "SELECT id, marca, modelo, patente, anio, capacidad_carga AS capacidadCarga FROM vehiculos WHERE id = ?",
      [id],
    );

    if (vehiculos.length === 0) {
      return res.status(404).json({ mensaje: "Vehículo no encontrado" });
    }

    res.json(vehiculos[0]);
  },
);

// POST /vehiculos -> crea un vehículo
router.post(
  "/",
  validarAutenticacion,
  validarVehiculo,
  verificarValidaciones,
  async (req, res) => {
    const { marca, modelo, patente, anio, capacidadCarga } = req.body;

    // La patente no puede repetirse
    const [existentes] = await db.execute(
      "SELECT id FROM vehiculos WHERE patente = ?",
      [patente],
    );
    if (existentes.length > 0) {
      return res
        .status(400)
        .json({ mensaje: "Ya existe un vehículo con esa patente" });
    }

    const [result] = await db.execute(
      "INSERT INTO vehiculos (marca, modelo, patente, anio, capacidad_carga) VALUES (?,?,?,?,?)",
      [marca, modelo, patente, anio, capacidadCarga],
    );

    // 201 = creado
    res
      .status(201)
      .json({ id: result.insertId, marca, modelo, patente, anio, capacidadCarga });
  },
);

// PUT /vehiculos/:id -> modifica un vehículo existente
router.put(
  "/:id",
  validarAutenticacion,
  validarId,
  validarVehiculo,
  verificarValidaciones,
  async (req, res) => {
    const id = Number(req.params.id);
    const { marca, modelo, patente, anio, capacidadCarga } = req.body;

    // ¿Existe el vehículo? Si no, 404
    const [actual] = await db.execute("SELECT id FROM vehiculos WHERE id = ?", [id]);
    if (actual.length === 0) {
      return res.status(404).json({ mensaje: "Vehículo no encontrado" });
    }

    // La patente no puede pertenecer a OTRO vehículo
    const [repetida] = await db.execute(
      "SELECT id FROM vehiculos WHERE patente = ? AND id <> ?",
      [patente, id],
    );
    if (repetida.length > 0) {
      return res
        .status(400)
        .json({ mensaje: "Ya existe otro vehículo con esa patente" });
    }

    await db.execute(
      "UPDATE vehiculos SET marca=?, modelo=?, patente=?, anio=?, capacidad_carga=? WHERE id=?",
      [marca, modelo, patente, anio, capacidadCarga, id],
    );

    res.json({ id, marca, modelo, patente, anio, capacidadCarga });
  },
);

// DELETE /vehiculos/:id -> elimina un vehículo
router.delete(
  "/:id",
  validarAutenticacion,
  validarId,
  verificarValidaciones,
  async (req, res) => {
    const id = Number(req.params.id);

    const [actual] = await db.execute("SELECT id FROM vehiculos WHERE id = ?", [id]);
    if (actual.length === 0) {
      return res.status(404).json({ mensaje: "Vehículo no encontrado" });
    }

    // Si tiene viajes registrados, no se puede borrar
    const [viajes] = await db.execute(
      "SELECT id FROM viajes WHERE vehiculo_id = ? LIMIT 1",
      [id],
    );
    if (viajes.length > 0) {
      return res.status(400).json({
        mensaje: "No se puede eliminar: el vehículo tiene viajes registrados",
      });
    }

    await db.execute("DELETE FROM vehiculos WHERE id = ?", [id]);

    // 204 = éxito sin contenido que devolver
    res.status(204).send();
  },
);

export default router;