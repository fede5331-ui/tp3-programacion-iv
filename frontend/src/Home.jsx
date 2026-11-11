import { Link } from "react-router";
import { useAuth } from "./Auth";

// Página principal pública: cualquier persona la ve, haya iniciado sesión o no
export function Home() {
  const { isAuthenticated, nombre } = useAuth();

  return (
    <>
      <h1>Gestión de transporte</h1>
      <p className="subtitulo">
        Administrá los vehículos de tu empresa, sus conductores y los viajes realizados.
      </p>

      {/* Resumen de lo que permite hacer la aplicación */}
      <div className="tarjetas">
        <section>
          <h3>Vehículos</h3>
          <p>Registrá la flota con marca, modelo, patente, año y capacidad de carga.</p>
        </section>
        <section>
          <h3>Conductores</h3>
          <p>Cargá los datos de cada conductor y controlá el vencimiento de su licencia.</p>
        </section>
        <section>
          <h3>Viajes</h3>
          <p>Registrá cada viaje, consultá el historial y calculá los kilómetros recorridos.</p>
        </section>
      </div>

      {/* El contenido de abajo cambia según haya o no una sesión iniciada */}
      {isAuthenticated ? (
        <div className="acciones-inicio">
          <p>Hola, {nombre}. ¿A dónde querés ir?</p>
          <Link to="/vehiculos">
            <button>Vehículos</button>
          </Link>
          <Link to="/conductores">
            <button>Conductores</button>
          </Link>
          <Link to="/viajes">
            <button>Viajes</button>
          </Link>
        </div>
      ) : (
        <div className="acciones-inicio">
          <p>Para usar la aplicación necesitás una cuenta.</p>
          <Link to="/login">
            <button>Ingresar</button>
          </Link>
          <Link to="/registro">
            <button>Crear cuenta</button>
          </Link>
        </div>
      )}
    </>
  );
}