import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useAuth } from "./Auth";
import { API_URL } from "./config";
import { esFechaHoraValida, esNumeroPositivo, esTextoValido } from "./validaciones";

// Valores iniciales de un formulario vacío
const FORM_VACIO = {
  vehiculoId: "",
  conductorId: "",
  fechaSalida: "",
  fechaLlegada: "",
  origen: "",
  destino: "",
  kilometros: "",
  observaciones: "",
};

// Formulario para registrar o modificar un viaje
export function ViajeFormulario() {
  const { fetchAuth } = useAuth();
  const navigate = useNavigate();
  // /viajes/5 -> id = "5". /viajes/crear -> id = undefined
  const { id } = useParams();

  const [form, setForm] = useState(FORM_VACIO);
  const [errores, setErrores] = useState({});
  const [errorApi, setErrorApi] = useState(null);
  // Listas para los desplegables de vehículo y conductor
  const [vehiculos, setVehiculos] = useState([]);
  const [conductores, setConductores] = useState([]);

  // Al abrir la página traemos los vehículos y conductores disponibles
  useEffect(() => {
    const cargarListas = async () => {
      const [rv, rc] = await Promise.all([
        fetchAuth(`${API_URL}/vehiculos`),
        fetchAuth(`${API_URL}/conductores`),
      ]);
      if (rv.ok) setVehiculos(await rv.json());
      if (rc.ok) setConductores(await rc.json());
    };
    cargarListas();
  }, [fetchAuth]);

  // En modo edición: traemos los datos actuales del viaje
  useEffect(() => {
    if (!id) return;

    const cargar = async () => {
      const response = await fetchAuth(`${API_URL}/viajes/${id}`);
      if (!response.ok) {
        setErrorApi("No se encontró el viaje");
        return;
      }
      const v = await response.json();
      setForm({
        vehiculoId: String(v.vehiculoId),
        conductorId: String(v.conductorId),
        fechaSalida: v.fechaSalida,
        fechaLlegada: v.fechaLlegada,
        origen: v.origen,
        destino: v.destino,
        kilometros: String(v.kilometros),
        observaciones: v.observaciones || "",
      });
    };
    cargar();
  }, [id, fetchAuth]);

  // Actualiza un solo campo sin perder los demás
  const cambiar = (campo) => (e) =>
    setForm((f) => ({ ...f, [campo]: e.target.value }));

  const validar = () => {
    const nuevos = {};
    if (!form.vehiculoId) nuevos.vehiculoId = "Seleccioná un vehículo";
    if (!form.conductorId) nuevos.conductorId = "Seleccioná un conductor";
    if (!esFechaHoraValida(form.fechaSalida)) nuevos.fechaSalida = "Ingresá fecha y hora de salida";
    if (!esFechaHoraValida(form.fechaLlegada)) {
      nuevos.fechaLlegada = "Ingresá fecha y hora de llegada";
    } else if (
      esFechaHoraValida(form.fechaSalida) &&
      new Date(form.fechaLlegada) < new Date(form.fechaSalida)
    ) {
      // Validación entre dos campos: la llegada no puede ser anterior a la salida
      nuevos.fechaLlegada = "La llegada no puede ser anterior a la salida";
    }
    if (!esTextoValido(form.origen, 100)) nuevos.origen = "El origen es obligatorio (máx. 100 caracteres)";
    if (!esTextoValido(form.destino, 100)) nuevos.destino = "El destino es obligatorio (máx. 100 caracteres)";
    if (!esNumeroPositivo(form.kilometros)) nuevos.kilometros = "Los kilómetros deben ser un número mayor a 0";
    if (form.observaciones.length > 255) nuevos.observaciones = "Máximo 255 caracteres";
    return nuevos;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorApi(null);

    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    // Editar = PUT sobre /viajes/:id. Crear = POST sobre /viajes
    const response = await fetchAuth(
      id ? `${API_URL}/viajes/${id}` : `${API_URL}/viajes`,
      {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehiculoId: Number(form.vehiculoId), // el backend espera números
          conductorId: Number(form.conductorId),
          fechaSalida: form.fechaSalida,
          fechaLlegada: form.fechaLlegada,
          origen: form.origen.trim(),
          destino: form.destino.trim(),
          kilometros: Number(form.kilometros),
          observaciones: form.observaciones.trim(),
        }),
      },
    );

    if (!response.ok) {
      const datos = await response.json();
      // Ej: "La licencia del conductor estaba vencida en la fecha de salida"
      setErrorApi(datos.errores?.[0]?.msg || datos.mensaje || "No se pudo guardar");
      return;
    }

    navigate("/viajes");
  };

  return (
    <>
      <h2>{id ? "Modificar viaje" : "Nuevo viaje"}</h2>
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="vehiculoId">Vehículo:</label>
        <select id="vehiculoId" value={form.vehiculoId} onChange={cambiar("vehiculoId")}>
          <option value="">Seleccione un vehículo</option>
          {vehiculos.map((v) => (
            <option key={v.id} value={v.id}>
              {v.marca} {v.modelo} - {v.patente}
            </option>
          ))}
        </select>
        {errores.vehiculoId && <p className="error">{errores.vehiculoId}</p>}

        <label htmlFor="conductorId">Conductor:</label>
        <select id="conductorId" value={form.conductorId} onChange={cambiar("conductorId")}>
          <option value="">Seleccione un conductor</option>
          {conductores.map((c) => (
            <option key={c.id} value={c.id}>
              {c.apellido}, {c.nombre}
            </option>
          ))}
        </select>
        {errores.conductorId && <p className="error">{errores.conductorId}</p>}

        {/* datetime-local: calendario + hora, entrega el valor como AAAA-MM-DDTHH:MM */}
        <label htmlFor="fechaSalida">Fecha y hora de salida:</label>
        <input
          id="fechaSalida"
          type="datetime-local"
          value={form.fechaSalida}
          onChange={cambiar("fechaSalida")}
        />
        {errores.fechaSalida && <p className="error">{errores.fechaSalida}</p>}

        <label htmlFor="fechaLlegada">Fecha y hora de llegada:</label>
        <input
          id="fechaLlegada"
          type="datetime-local"
          value={form.fechaLlegada}
          onChange={cambiar("fechaLlegada")}
        />
        {errores.fechaLlegada && <p className="error">{errores.fechaLlegada}</p>}

        <label htmlFor="origen">Origen:</label>
        <input id="origen" value={form.origen} onChange={cambiar("origen")} />
        {errores.origen && <p className="error">{errores.origen}</p>}

        <label htmlFor="destino">Destino:</label>
        <input id="destino" value={form.destino} onChange={cambiar("destino")} />
        {errores.destino && <p className="error">{errores.destino}</p>}

        <label htmlFor="kilometros">Kilómetros:</label>
        <input
          id="kilometros"
          type="number"
          value={form.kilometros}
          onChange={cambiar("kilometros")}
        />
        {errores.kilometros && <p className="error">{errores.kilometros}</p>}

        <label htmlFor="observaciones">Observaciones (opcional):</label>
        <textarea
          id="observaciones"
          value={form.observaciones}
          onChange={cambiar("observaciones")}
        />
        {errores.observaciones && <p className="error">{errores.observaciones}</p>}

        {errorApi && <p className="error">{errorApi}</p>}

        <div>
          <button type="submit">{id ? "Guardar cambios" : "Registrar viaje"}</button>
          <Link to="/viajes">
            <button type="button">Volver</button>
          </Link>
        </div>
      </form>
    </>
  );
}