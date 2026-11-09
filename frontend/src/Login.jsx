import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "./Auth";
import { esEmailValido } from "./validaciones";

// Página de inicio de sesión
export function Login() {
  const { error, login } = useAuth();
  const navigate = useNavigate();

  // Estado de los campos del formulario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Errores de validación del frontend, uno por campo
  const [errores, setErrores] = useState({});

  // Revisa los campos y devuelve un objeto con los errores encontrados
  const validar = () => {
    const nuevos = {};
    if (!esEmailValido(email)) nuevos.email = "Ingresá un email válido";
    if (password === "") nuevos.password = "La contraseña es obligatoria";
    return nuevos;
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // evita que el navegador recargue la página

    const nuevos = validar();
    setErrores(nuevos);
    // Si hay errores, no llamamos al backend
    if (Object.keys(nuevos).length > 0) return;

    const res = await login(email.trim(), password);
    if (res.success) {
      navigate("/vehiculos");
    }
  };

  return (
    <>
      <h2>Ingresar</h2>
      {/* noValidate: desactiva los mensajes del navegador para mostrar los nuestros */}
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="email">Email:</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errores.email && <p className="error">{errores.email}</p>}

        <label htmlFor="password">Contraseña:</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {errores.password && <p className="error">{errores.password}</p>}

        {/* Error que devolvió el backend (por ejemplo: credenciales inválidas) */}
        {error && <p className="error">{error}</p>}

        <div>
          <button type="submit">Ingresar</button>
          <Link to="/">
            <button type="button">Volver</button>
          </Link>
        </div>
      </form>
    </>
  );
}