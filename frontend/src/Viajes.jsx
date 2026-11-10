import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useAuth } from "./Auth";
import { API_URL } from "./config";

// Página: historial de viajes, con filtro por vehículo/conductor y total de kilómetros
export function Viajes() {
  const { fetchAuth } = useAuth();
  // useSearchParams lee y modifica los parámetros de la URL (?vehiculoId=2&conductorId=1)
  const [searchParams, setSearchParams] = useSearchParams();
  const vehiculoId = searchParams.get("vehiculoId") || "";
  const conductorId = searchParams.get("conductorId") || "";

  const [viajes, setViajes] = useState([]);
  const [total, setTotal] = useState({ totalKilometros: 0, cantidadViajes: 0 });
  // Listas para llenar los desplegables de filtro
  const [vehiculos, setVehiculos] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [mensaje, setMensaje] = useState(null);

  // Al abrir la página traemos los vehículos y conductores para los desplegables
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

  // Trae los viajes y el total de km con los filtros actuales (los dos pedidos en paralelo)
  const obtenerViajes = useCallback(async () => {
    const parametros = new URLSearchParams();
    if (vehiculoId) parametros.append("vehiculoId", vehiculoId);
    if (conductorId) parametros.append("conductorId", conductorId);
    const query = parametros.toString() ? `?${parametros.toString()}` : "";

    try {
      const [rViajes, rTotal] = await Promise.all([
        fetchAuth(`${API_URL}/viajes${query}`),
        fetchAuth(`${API_URL}/viajes/kilometros${query}`),
      ]);
      setViajes(rViajes.ok ? await rViajes.json() : []);
      if (rTotal.ok) setTotal(await rTotal.json());
    } catch {
      setMensaje("No se pudo conectar con el servidor");
    }
  }, [vehiculoId, conductorId, fetchAuth]);

  // Se ejecuta al abrir la página y cada vez que cambia un filtro
  useEffect(() => {
    obtenerViajes();
  }, [obtenerViajes]);

  // Cambia un filtro actualizando la URL (si el valor está vacío, lo quita)
  const cambiarFiltro = (nombre, valor) => {
    const nuevos = new URLSearchParams(searchParams);
    if (valor) nuevos.set(nombre, valor);
    else nuevos.delete(nombre);
    setSearchParams(nuevos);
  };

  // Elimina un viaje (pide confirmación antes)
  const eliminar = async (viaje) => {
    if (!confirm(`¿Eliminar el viaje ${viaje.origen} → ${viaje.destino}?`)) return;

    setMensaje(null);
    const response = await fetchAuth(`${API_URL}/viajes/${viaje.id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      obtenerViajes();
    } else {
      const datos = await response.json();
      setMensaje(datos.mensaje || "No se pudo eliminar el viaje");
    }
  };

  // Muestra "2026-11-05T08:00" como "2026-11-05 08:00"
  const formatearFecha = (fecha) => fecha.replace("T", " ");

  return (
    <>
      <h1>Viajes</h1>

      <h2>Filtros</h2>
      <label htmlFor="filtroVehiculo">Vehículo:</label>
      <select
        id="filtroVehiculo"
        value={vehiculoId}
        onChange={(e) => cambiarFiltro("vehiculoId", e.target.value)}
      >
        <option value="">Todos</option>
        {vehiculos.map((v) => (
          <option key={v.id} value={v.id}>
            {v.marca} {v.modelo} - {v.patente}
          </option>
        ))}
      </select>

      <label htmlFor="filtroConductor">Conductor:</label>
      <select
        id="filtroConductor"
        value={conductorId}
        onChange={(e) => cambiarFiltro("conductorId", e.target.value)}
      >
        <option value="">Todos</option>
        {conductores.map((c) => (
          <option key={c.id} value={c.id}>
            {c.apellido}, {c.nombre}
          </option>
        ))}
      </select>

      {/* Total de kilómetros según los filtros elegidos */}
      <p>
        <b>Total recorrido: {total.totalKilometros} km</b> en {total.cantidadViajes}{" "}
        {total.cantidadViajes === 1 ? "viaje" : "viajes"}
      </p>

      <h2>Historial</h2>
      <Link to="/viajes/crear">
        <button>Nuevo viaje</button>
      </Link>

      {mensaje && <p className="error">{mensaje}</p>}

      <table>
        <thead>
          <tr>
            <th>Salida</th>
            <th>Llegada</th>
            <th>Origen</th>
            <th>Destino</th>
            <th>Vehículo</th>
            <th>Conductor</th>
            <th>Km</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {viajes.map((v) => (
            <tr key={v.id}>
              <td>{formatearFecha(v.fechaSalida)}</td>
              <td>{formatearFecha(v.fechaLlegada)}</td>
              <td>{v.origen}</td>
              <td>{v.destino}</td>
              <td>{v.patente}</td>
              <td>{v.conductor}</td>
              <td>{v.kilometros}</td>
              <td>
                <Link to={`/viajes/${v.id}`}>
                  <button>Editar</button>
                </Link>
                <button onClick={() => eliminar(v)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {viajes.length === 0 && <p>No hay viajes para mostrar.</p>}
    </>
  );
}