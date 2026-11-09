import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { useAuth } from "./Auth";

// Marco común de todas las páginas: menú de navegación + contenido de la página actual
export function Layout() {
  const { isAuthenticated, nombre, logout } = useAuth();
  // useLocation da la ruta actual (la usamos para marcar el link activo)
  const { pathname } = useLocation();
  // useNavigate permite cambiar de página desde el código
  const navigate = useNavigate();

  return (
    <main>
      <nav>
        <ul>
          <li className={pathname === "/" ? "active" : ""}>
            <Link to="/">Inicio</Link>
          </li>

          {/* Si hay sesión iniciada mostramos el menú de gestión; si no, ingresar/registrarse */}
          {isAuthenticated ? (
            <>
              <li className={pathname.startsWith("/vehiculos") ? "active" : ""}>
                <Link to="/vehiculos">Vehículos</Link>
              </li>
              <li className={pathname.startsWith("/conductores") ? "active" : ""}>
                <Link to="/conductores">Conductores</Link>
              </li>
              <li className={pathname.startsWith("/viajes") ? "active" : ""}>
                <Link to="/viajes">Viajes</Link>
              </li>
              <li className="usuario">{nombre}</li>
              <li>
                <button
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                >
                  Salir
                </button>
              </li>
            </>
          ) : (
            <>
              <li className={pathname.startsWith("/login") ? "active" : ""}>
                <Link to="/login">Ingresar</Link>
              </li>
              <li className={pathname.startsWith("/registro") ? "active" : ""}>
                <Link to="/registro">Registrarse</Link>
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* Acá se dibuja la página que corresponde a la ruta actual */}
      <Outlet />
    </main>
  );
}