import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "./Auth";
import { esEmailValido, esPasswordValida, esTextoValido } from "./validaciones";

// Página de registro de usuarios nuevos
export function Registro() {
  const { error, registrar } = useAuth();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [errores, setErrores] = useState({});

  const validar = () => {
    const nuevos = {};
    if (!esTextoValido(nombre, 100)) nuevos.nombre = "El nombre es obligatorio (máx. 100 caracteres)";
    if (!esEmailValido(email)) nuevos.email = "Ingresá un email válido";
    if (!esPasswordValida(password)) nuevos.password = "Mínimo 8 caracteres y al menos un número";
    if (confirmar !== password) nuevos.confirmar = "Las contraseñas no coinciden";
    return nuevos;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    // Solo mandamos nombre, email y contraseña: la confirmación no viaja al backend
    const res = await registrar(nombre.trim(), email.trim(), password);
    if (res.success) {
      navigate("/login");
    }
  };

  return (
    <>
      <h2>Crear cuenta</h2>
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="nombre">Nombre:</label>
        <input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        {errores.nombre && <p className="error">{errores.nombre}</p>}

        <label htmlFor="email">Email:</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        {errores.email && <p className="error">{errores.email}</p>}

        <label htmlFor="password">Contraseña:</label>
        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {errores.password && <p className="error">{errores.password}</p>}

        <label htmlFor="confirmar">Repetir contraseña:</label>
        <input id="confirmar" type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
        {errores.confirmar && <p className="error">{errores.confirmar}</p>}

        {/* Error que devolvió el backend (por ejemplo: email ya registrado) */}
        {error && <p className="error">{error}</p>}

        <div>
          <button type="submit">Registrarme</button>
          <Link to="/">
            <button type="button">Volver</button>
          </Link>
        </div>
      </form>
    </>
  );
}