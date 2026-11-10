import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useAuth } from "./Auth";
import { API_URL } from "./config";
import {
  esDocumentoValido,
  esFechaValida,
  esLicenciaValida,
  esTextoValido,
} from "./validaciones";

// Valores iniciales de un formulario vacío (todo como texto, igual que los inputs)
const FORM_VACIO = {
  nombre: "",
  apellido: "",
  numeroDocumento: "",
  numeroLicencia: "",
  fechaAltaLicencia: "",
  fechaVencimientoLicencia: "",
};

// Formulario para crear o modificar un conductor
export function ConductorFormulario() {
  const { fetchAuth } = useAuth();
  const navigate = useNavigate();
  // /conductores/5 -> id = "5". /conductores/crear -> id = undefined
  const { id } = useParams();

  const [form, setForm] = useState(FORM_VACIO);
  const [errores, setErrores] = useState({});
  const [errorApi, setErrorApi] = useState(null);

  // En modo edición: traemos los datos actuales del conductor al abrir la página
  useEffect(() => {
    if (!id) return;

    const cargar = async () => {
      const response = await fetchAuth(`${API_URL}/conductores/${id}`);
      if (!response.ok) {
        setErrorApi("No se encontró el conductor");
        return;
      }
      const c = await response.json();
      setForm({
        nombre: c.nombre,
        apellido: c.apellido,
        numeroDocumento: c.numeroDocumento,
        numeroLicencia: c.numeroLicencia,
        fechaAltaLicencia: c.fechaAltaLicencia,
        fechaVencimientoLicencia: c.fechaVencimientoLicencia,
      });
    };
    cargar();
  }, [id, fetchAuth]);

  // Actualiza un solo campo sin perder los demás
  const cambiar = (campo) => (e) =>
    setForm((f) => ({ ...f, [campo]: e.target.value }));

  const validar = () => {
    const nuevos = {};
    if (!esTextoValido(form.nombre, 50)) nuevos.nombre = "El nombre es obligatorio (máx. 50 caracteres)";
    if (!esTextoValido(form.apellido, 50)) nuevos.apellido = "El apellido es obligatorio (máx. 50 caracteres)";
    if (!esDocumentoValido(form.numeroDocumento))
      nuevos.numeroDocumento = "El documento debe tener entre 7 y 9 dígitos, sin puntos";
    if (!esLicenciaValida(form.numeroLicencia))
      nuevos.numeroLicencia = "La licencia debe tener entre 5 y 20 letras o números";
    if (!esFechaValida(form.fechaAltaLicencia))
      nuevos.fechaAltaLicencia = "Ingresá una fecha de alta válida";
    if (!esFechaValida(form.fechaVencimientoLicencia)) {
      nuevos.fechaVencimientoLicencia = "Ingresá una fecha de vencimiento válida";
    } else if (
      esFechaValida(form.fechaAltaLicencia) &&
      form.fechaVencimientoLicencia <= form.fechaAltaLicencia
    ) {
      // Validación entre dos campos: el vencimiento tiene que ser posterior al alta
      nuevos.fechaVencimientoLicencia = "El vencimiento debe ser posterior al alta";
    }
    return nuevos;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorApi(null);

    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    // Editar = PUT sobre /conductores/:id. Crear = POST sobre /conductores
    const response = await fetchAuth(
      id ? `${API_URL}/conductores/${id}` : `${API_URL}/conductores`,
      {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          numeroDocumento: form.numeroDocumento.trim(),
          numeroLicencia: form.numeroLicencia.trim(),
          fechaAltaLicencia: form.fechaAltaLicencia,
          fechaVencimientoLicencia: form.fechaVencimientoLicencia,
        }),
      },
    );

    if (!response.ok) {
      const datos = await response.json();
      setErrorApi(datos.errores?.[0]?.msg || datos.mensaje || "No se pudo guardar");
      return;
    }

    navigate("/conductores");
  };

  return (
    <>
      <h2>{id ? "Modificar conductor" : "Nuevo conductor"}</h2>
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="nombre">Nombre:</label>
        <input id="nombre" value={form.nombre} onChange={cambiar("nombre")} />
        {errores.nombre && <p className="error">{errores.nombre}</p>}

        <label htmlFor="apellido">Apellido:</label>
        <input id="apellido" value={form.apellido} onChange={cambiar("apellido")} />
        {errores.apellido && <p className="error">{errores.apellido}</p>}

        <label htmlFor="numeroDocumento">Número de documento:</label>
        <input
          id="numeroDocumento"
          value={form.numeroDocumento}
          onChange={cambiar("numeroDocumento")}
        />
        {errores.numeroDocumento && <p className="error">{errores.numeroDocumento}</p>}

        <label htmlFor="numeroLicencia">Número de licencia:</label>
        <input
          id="numeroLicencia"
          value={form.numeroLicencia}
          onChange={cambiar("numeroLicencia")}
        />
        {errores.numeroLicencia && <p className="error">{errores.numeroLicencia}</p>}

        {/* type="date" muestra un calendario y entrega el valor como AAAA-MM-DD */}
        <label htmlFor="fechaAltaLicencia">Fecha de alta de la licencia:</label>
        <input
          id="fechaAltaLicencia"
          type="date"
          value={form.fechaAltaLicencia}
          onChange={cambiar("fechaAltaLicencia")}
        />
        {errores.fechaAltaLicencia && <p className="error">{errores.fechaAltaLicencia}</p>}

        <label htmlFor="fechaVencimientoLicencia">Fecha de vencimiento de la licencia:</label>
        <input
          id="fechaVencimientoLicencia"
          type="date"
          value={form.fechaVencimientoLicencia}
          onChange={cambiar("fechaVencimientoLicencia")}
        />
        {errores.fechaVencimientoLicencia && (
          <p className="error">{errores.fechaVencimientoLicencia}</p>
        )}

        {errorApi && <p className="error">{errorApi}</p>}

        <div>
          <button type="submit">{id ? "Guardar cambios" : "Crear"}</button>
          <Link to="/conductores">
            <button type="button">Volver</button>
          </Link>
        </div>
      </form>
    </>
  );
}