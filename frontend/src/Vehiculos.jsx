import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "./Auth";
import { API_URL } from "./config";

// Página: listado de vehículos con filtros y acciones
export function Vehiculos() {
  const { fetchAuth } = useAuth();
  const [vehiculos, setVehiculos] = useState([]);
  const [filtros, setFiltros] = useState({ marca: "", patente: "" });
  // Mensaje de error para mostrar al usuario (por ejemplo, si no se puede eliminar)
  const [mensaje, setMensaje] = useState(null);

  // Pide la lista al backend aplicando los filtros. useCallback evita recrear la función en cada render
  const obtenerVehiculos = useCallback(async () => {
    const url = new URL(`${API_URL}/vehiculos`);
    // Solo agregamos los filtros que tienen valor
    if (filtros.marca.trim()) url.searchParams.append("marca", filtros.marca.trim());
    if (filtros.patente.trim()) url.searchParams.append("patente", filtros.patente.trim());

    try {
      const response = await fetchAuth(url);
      if (!response.ok) {
        setVehiculos([]);
        return;
      }
      setVehiculos(await response.json());
    } catch {
      setMensaje("No se pudo conectar con el servidor");
    }
  }, [filtros, fetchAuth]);

  // Se ejecuta al abrir la página y cada vez que cambian los filtros
  useEffect(() => {
    obtenerVehiculos();
  }, [obtenerVehiculos]);

  // Elimina un vehículo (pide confirmación antes)
  const eliminar = async (vehiculo) => {
    if (!confirm(`¿Eliminar el vehículo ${vehiculo.patente}?`)) return;

    setMensaje(null);
    const response = await fetchAuth(`${API_URL}/vehiculos/${vehiculo.id}`, {
      method: "DELETE",
    });

    if (response.ok) {
      obtenerVehiculos(); // recargamos la lista
    } else {
      // Mostramos el motivo que explica el backend (ej: tiene viajes registrados)
      const datos = await response.json();
      setMensaje(datos.mensaje || "No se pudo eliminar el vehículo");
    }
  };

  return (
    <>
      <h1>Vehículos</h1>

      <h2>Filtros</h2>
      <label htmlFor="filtroMarca">Marca:</label>
      <input
        id="filtroMarca"
        value={filtros.marca}
        onChange={(e) => setFiltros((f) => ({ ...f, marca: e.target.value }))}
      />
      <label htmlFor="filtroPatente">Patente:</label>
      <input
        id="filtroPatente"
        value={filtros.patente}
        onChange={(e) => setFiltros((f) => ({ ...f, patente: e.target.value }))}
      />

      <h2>Listado</h2>
      <Link to="/vehiculos/crear">
        <button>Nuevo vehículo</button>
      </Link>

      {mensaje && <p className="error">{mensaje}</p>}

      <table>
        <thead>
          <tr>
            <th>Marca</th>
            <th>Modelo</th>
            <th>Patente</th>
            <th>Año</th>
            <th>Capacidad (kg)</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {vehiculos.map((v) => (
            <tr key={v.id}>
              <td>{v.marca}</td>
              <td>{v.modelo}</td>
              <td>{v.patente}</td>
              <td>{v.anio}</td>
              <td>{Number(v.capacidadCarga)}</td>
              <td>
                <Link to={`/vehiculos/${v.id}`}>
                  <button>Editar</button>
                </Link>
                <Link to={`/viajes?vehiculoId=${v.id}`}>
                  <button>Ver viajes</button>
                </Link>
                <button onClick={() => eliminar(v)}>Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {vehiculos.length === 0 && <p>No hay vehículos para mostrar.</p>}
    </>
  );
}