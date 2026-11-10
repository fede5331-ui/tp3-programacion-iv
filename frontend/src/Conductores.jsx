import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "./Auth";
import { API_URL } from "./config";

// Fecha de hoy como "AAAA-MM-DD" (el formato "sv-SE" da justo ese orden)
const hoy = () => new Date().toLocaleDateString("sv-SE");

// Página: listado de conductores con filtros y acciones
export function Conductores() {
  const { fetchAuth } = useAuth();
  const [conductores, setConductores] = useState([]);
  const [filtros, setFiltros] = useState({ apellido: "", documento: "" });
  const [mensaje, setMensaje] = useState(null);

  // Pide la lista al backend aplicando los filtros que tengan valor
  const obtenerConductores = useCallback(async () => {
    const url = new URL(`${API_URL}/conductores`);
    if (filtros.apellido.trim()) url.searchParams.append("apellido", filtros.apellido.trim());
    if (filtros.documento.trim()) url.searchParams.append("documento", filtros.documento.trim());

    try {
      const response = await fetchAuth(url);
      if (!response.ok) {
        setConductores([]);
        return;
      }
      setConductores(await response.json());
    } catch {
      setMensaje("No se pudo conectar con el servidor");
    }
  }, [filtros, fetchAuth]);

  // Se ejecuta al abrir la página y cada vez que cambian los filtros
  useEffect(() => {
    obtenerConductores();
  }, [obtenerConductores]);

  // Elimina un conductor (pide confirmación antes)
  const eliminar = async (c) => {
    if (!confirm(`¿Eliminar al conductor ${c.apellido}, ${c.nombre}?`)) return;

    setMensaje(null);
    const response = await fetchAuth(`${API_URL}/conductores/${c.id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      obtenerConductores();
    } else {
      // Mostramos el motivo que explica el backend (ej: tiene viajes registrados)
      const datos = await response.json();
      setMensaje(datos.mensaje || "No se pudo eliminar el conductor");
    }
  };

  return (
    <>
      <h1>Conductores</h1>

      <h2>Filtros</h2>
      <label htmlFor="filtroApellido">Apellido:</label>
      <input
        id="filtroApellido"
        value={filtros.apellido}
        onChange={(e) => setFiltros((f) => ({ ...f, apellido: e.target.value }))}
      />
      <label htmlFor="filtroDocumento">Documento:</label>
      <input
        id="filtroDocumento"
        value={filtros.documento}
        onChange={(e) => setFiltros((f) => ({ ...f, documento: e.target.value }))}
      />

      <h2>Listado</h2>
      <Link to="/conductores/crear">
        <button>Nuevo conductor</button>
      </Link>

      {mensaje && <p className="error">{mensaje}</p>}

      <table>
        <thead>
          <tr>
            <th>Apellido y nombre</th>
            <th>Documento</th>
            <th>Licencia</th>
            <th>Alta licencia</th>
            <th>Vence</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {conductores.map((c) => (
            <tr key={c.id}>
              <td>
                {c.apellido}, {c.nombre}
              </td>
              <td>{c.numeroDocumento}</td>
              <td>{c.numeroLicencia}</td>
              <td>{c.fechaAltaLicencia}</td>
              {/* Si el vencimiento es anterior a hoy, la licencia está vencida: se marca con la clase "error" */}
              <td className={c.fechaVencimientoLicencia < hoy() ? "error" : ""}>
                {c.fechaVencimientoLicencia}
                {c.fechaVencimientoLicencia < hoy() && " (vencida)"}
              </td>
              <td>
                <Link to={`/conductores/${c.id}`}>
                  <button>Editar</button>
                </Link>
                <Link to={`/viajes?conductorId=${c.id}`}>
                  <button>Ver viajes</button>
                </Link>
                <button onClick={() => eliminar(c)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {conductores.length === 0 && <p>No hay conductores para mostrar.</p>}
    </>
  );
}