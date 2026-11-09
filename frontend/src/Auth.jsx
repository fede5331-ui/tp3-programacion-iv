import { createContext, useCallback, useContext, useState } from "react";
import { API_URL } from "./config";

// Contexto que comparte el estado de la sesión con toda la aplicación
const AuthContext = createContext(null);

// Hook personalizado: cualquier componente hace useAuth() para acceder a la sesión
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  return useContext(AuthContext);
};

// Lee la sesión guardada en el navegador (así no se pierde al recargar la página).
// try/catch por si el navegador bloquea el almacenamiento.
function leerSesionGuardada() {
  try {
    return JSON.parse(localStorage.getItem("sesion")) || {};
  } catch {
    return {};
  }
}

// Componente que envuelve la app y provee la sesión a todos los demás
export const AuthProvider = ({ children }) => {
  const guardada = leerSesionGuardada();
  const [token, setToken] = useState(guardada.token || null);
  const [nombre, setNombre] = useState(guardada.nombre || null);
  const [error, setError] = useState(null);

  // Inicia sesión: pide el token al backend y lo guarda
  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const datos = await response.json();

      // 400 (datos mal formados) o 401 (credenciales inválidas): mostramos el mensaje del backend
      if (!response.ok) {
        throw new Error(datos.mensaje || "No se pudo iniciar sesión");
      }

      setToken(datos.token);
      setNombre(datos.nombre);
      localStorage.setItem(
        "sesion",
        JSON.stringify({ token: datos.token, nombre: datos.nombre }),
      );
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false };
    }
  }, []);

  // Registra un usuario nuevo (no inicia sesión: después hay que hacer login)
  const registrar = useCallback(async (nombre, email, password) => {
    setError(null);
    try {
      const response = await fetch(`${API_URL}/auth/registro`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, password }),
      });

      const datos = await response.json();

      if (!response.ok) {
        // Si hay detalle de validaciones, mostramos el primer mensaje concreto
        const detalle = datos.errores?.[0]?.msg;
        throw new Error(detalle || datos.mensaje || "No se pudo registrar");
      }

      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false };
    }
  }, []);

  // Cierra sesión: borra todo
  const logout = useCallback(() => {
    setToken(null);
    setNombre(null);
    setError(null);
    localStorage.removeItem("sesion");
  }, []);

  // fetch que agrega automáticamente el token en el encabezado Authorization.
  // Lo usamos para todas las rutas protegidas (vehículos, conductores, viajes).
  const fetchAuth = useCallback(
    async (url, options = {}) => {
      if (!token) {
        throw new Error("No está iniciada la sesión");
      }

      const response = await fetch(url, {
        ...options,
        headers: { ...options.headers, Authorization: `Bearer ${token}` },
      });

      // 401 = token vencido o inválido (dura 4 horas): cerramos la sesión
      if (response.status === 401) {
        logout();
      }

      return response;
    },
    [token, logout],
  );

  return (
    <AuthContext.Provider
      value={{
        token,
        nombre,
        error,
        isAuthenticated: !!token,
        login,
        registrar,
        logout,
        fetchAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};