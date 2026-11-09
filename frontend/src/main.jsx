import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import "./index.css";
import { AuthProvider } from "./Auth";
import { Layout } from "./Layout";
import { AuthLayout } from "./AuthLayout";
import { Home } from "./Home";
import { Login } from "./Login";
import { Registro } from "./Registro";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* AuthProvider va por fuera: así toda la app puede usar useAuth() */}
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Layout dibuja el menú y, debajo, la página que corresponda a la URL */}
          <Route element={<Layout />}>
            {/* Rutas públicas: se ven sin iniciar sesión */}
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="registro" element={<Registro />} />

            {/* Rutas protegidas: AuthLayout redirige al login si no hay sesión */}
            <Route path="vehiculos" element={<AuthLayout />}>
              {/* Página provisoria: la reemplazamos por la real en los próximos pasos */}
              <Route index element={<h2>Vehículos (próximamente)</h2>} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
);