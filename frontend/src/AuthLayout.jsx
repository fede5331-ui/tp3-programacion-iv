import { Navigate, Outlet } from "react-router";
import { useAuth } from "./Auth";

// Protege un grupo de rutas: solo deja pasar si hay sesión iniciada
export function AuthLayout() {
  const { isAuthenticated } = useAuth();

  // Sin sesión: redirige al login. "replace" evita que el botón Atrás vuelva a la página protegida
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Con sesión: muestra la página hija que corresponda
  return <Outlet />;
}