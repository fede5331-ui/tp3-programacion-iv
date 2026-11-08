import express from "express";
import { query } from "express-validator";
import { db } from "./db.js";
import {
  validarAutenticacion,
  validarConductor,
  validarId,
  verificarValidaciones,
} from "./validaciones.js";

const router = express.Router();

// Columnas que devolvemos. Renombramos a camelCase y damos formato AAAA-MM-DD a las fechas
const COLUMNAS =
  "id, nombre, apellido, numero_documento AS numeroDocumento, numero_licencia AS numeroLicencia, " +
  "DATE_FORMAT(fecha_alta_licencia, '%Y-%m-%d') AS fechaAltaLicencia, " +
  "DATE_FORMAT(fecha_vencimiento_licencia, '%Y-%m-%d') AS fechaVencimientoLicencia";

// GET /conductores -> lista (opcional: ?apellido=perez&documento=123)
router.get(
  "/",
  validarAutenticacion,
  [
    query("apellido").optional().trim().isLength({ min: 1, max: 50 }),
    query("documento").optional().trim().isNumeric().isLength({ max: 9 }),
  ],
  verificarValidaciones,
  async (req, res) => {
    const filtros = [];
    const parametros = [];
    const { apellido, documento } = req.query;

    if (apellido) {
      filtros.push("apellido LIKE ?");
      parametros.push(`%${apellido}%`);
    }
    if (documento) {
      filtros.push("numero_documento LIKE ?");
      parametros.push(`%${documento}%`);
    }

    let sql = `SELECT ${COLUMNAS} FROM conductores`;
    if (filtros.length > 0) {
      sql += " WHERE " + filtros.join(" AND ");
    }

    const [conductores] = await db.execute(sql, parametros);
    res.json(conductores);
  },
);

// GET /conductores/:id -> devuelve un conductor
router.get(
  "/:id",
  validarAutenticacion,
  validarId,
  verificarValidaciones,
  async (req, res) => {
    const id = Number(req.params.id);

    const [conductores] = await db.execute(
      `SELECT ${COLUMNAS} FROM conductores WHERE id = ?`,
      [id],
    );

    if (conductores.length === 0) {
      return res.status(404).json({ mensaje: "Conductor no encontrado" });
    }

    res.json(conductores[0]);
  },
);

// POST /conductores -> crea un conductor
router.post(
  "/",
  validarAutenticacion,
  validarConductor,
  verificarValidaciones,
  async (req, res) => {
    const {
      nombre,
      apellido,
      numeroDocumento,
      numeroLicencia,
      fechaAltaLicencia,
      fechaVencimientoLicencia,
    } = req.body;

    // Documento y licencia no pueden repetirse
    const [repetidos] = await db.execute(
      "SELECT id FROM conductores WHERE numero_documento = ? OR numero_licencia = ?",
      [numeroDocumento, numeroLicencia],
    );
    if (repetidos.length > 0) {
      return res
        .status(400)
        .json({ mensaje: "Ya existe un conductor con ese documento o licencia" });
    }

    const [result] = await db.execute(
      "INSERT INTO conductores (nombre, apellido, numero_documento, numero_licencia, fecha_alta_licencia, fecha_vencimiento_licencia) VALUES (?,?,?,?,?,?)",
      [
        nombre,
        apellido,
        numeroDocumento,
        numeroLicencia,
        fechaAltaLicencia,
        fechaVencimientoLicencia,
      ],
    );

    res.status(201).json({
      id: result.insertId,
      nombre,
      apellido,
      numeroDocumento,
      numeroLicencia,
      fechaAltaLicencia,
      fechaVencimientoLicencia,
    });
  },
);

// PUT /conductores/:id -> modifica un conductor existente
router.put(
  "/:id",
  validarAutenticacion,
  validarId,
  validarConductor,
  verificarValidaciones,
  async (req, res) => {
    const id = Number(req.params.id);
    const {
      nombre,
      apellido,
      numeroDocumento,
      numeroLicencia,
      fechaAltaLicencia,
      fechaVencimientoLicencia,
    } = req.body;

    const [actual] = await db.execute("SELECT id FROM conductores WHERE id = ?", [id]);
    if (actual.length === 0) {
      return res.status(404).json({ mensaje: "Conductor no encontrado" });
    }

    // Documento o licencia no pueden pertenecer a OTRO conductor
    const [repetidos] = await db.execute(
      "SELECT id FROM conductores WHERE (numero_documento = ? OR numero_licencia = ?) AND id <> ?",
      [numeroDocumento, numeroLicencia, id],
    );
    if (repetidos.length > 0) {
      return res.status(400).json({
        mensaje: "Otro conductor ya tiene ese documento o licencia",
      });
    }

    await db.execute(
      "UPDATE conductores SET nombre=?, apellido=?, numero_documento=?, numero_licencia=?, fecha_alta_licencia=?, fecha_vencimiento_licencia=? WHERE id=?",
      [
        nombre,
        apellido,
        numeroDocumento,
        numeroLicencia,
        fechaAltaLicencia,
        fechaVencimientoLicencia,
        id,
      ],
    );

    res.json({
      id,
      nombre,
      apellido,
      numeroDocumento,
      numeroLicencia,
      fechaAltaLicencia,
      fechaVencimientoLicencia,
    });
  },
);

// DELETE /conductores/:id -> elimina un conductor
router.delete(
  "/:id",
  validarAutenticacion,
  validarId,
  verificarValidaciones,
  async (req, res) => {
    const id = Number(req.params.id);

    const [actual] = await db.execute("SELECT id FROM conductores WHERE id = ?", [id]);
    if (actual.length === 0) {
      return res.status(404).json({ mensaje: "Conductor no encontrado" });
    }

    // Si tiene viajes registrados, no se puede borrar
    const [viajes] = await db.execute(
      "SELECT id FROM viajes WHERE conductor_id = ? LIMIT 1",
      [id],
    );
    if (viajes.length > 0) {
      return res.status(400).json({
        mensaje: "No se puede eliminar: el conductor tiene viajes registrados",
      });
    }

    await db.execute("DELETE FROM conductores WHERE id = ?", [id]);
    res.status(204).send();
  },
);

export default router;