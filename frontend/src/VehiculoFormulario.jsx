import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useAuth } from "./Auth";
import { API_URL } from "./config";
import {
  esEnteroEnRango,
  esNumeroPositivo,
  esPatenteValida,
  esTextoValido,
} from "./validaciones";

// Valores iniciales de un formulario vacío (todo como texto, que es lo que manejan los inputs)
const FORM_VACIO = { marca: "", modelo: "", patente: "", anio: "", capacidadCarga: "" };

// Formulario para crear o modificar un vehículo
export function VehiculoFormulario() {
  const { fetchAuth } = useAuth();
  const navigate = useNavigate();
  // Si la URL es /vehiculos/5, id vale "5". Si es /vehiculos/crear, id es undefined
  const { id } = useParams();

  const [form, setForm] = useState(FORM_VACIO);
  const [errores, setErrores] = useState({}); // errores de validación del frontend
  const [errorApi, setErrorApi] = useState(null); // error que devuelve el backend

  // En modo edición: al abrir la página, traemos los datos actuales del vehículo
  useEffect(() => {
    if (!id) return;

    const cargar = async () => {
      const response = await fetchAuth(`${API_URL}/vehiculos/${id}`);
      if (!response.ok) {
        setErrorApi("No se encontró el vehículo");
        return;
      }
      const v = await response.json();
      setForm({
        marca: v.marca,
        modelo: v.modelo,
        patente: v.patente,
        anio: String(v.anio),
        capacidadCarga: String(Number(v.capacidadCarga)),
      });
    };
    cargar();
  }, [id, fetchAuth]);

  // Actualiza un solo campo del formulario sin perder los demás
  const cambiar = (campo) => (e) =>
    setForm((f) => ({ ...f, [campo]: e.target.value }));

  // Valida los campos y devuelve un objeto con los errores encontrados
  const validar = () => {
    const nuevos = {};
    if (!esTextoValido(form.marca, 50)) nuevos.marca = "La marca es obligatoria (máx. 50 caracteres)";
    if (!esTextoValido(form.modelo, 50)) nuevos.modelo = "El modelo es obligatorio (máx. 50 caracteres)";
    if (!esPatenteValida(form.patente)) nuevos.patente = "Patente inválida (ej: AB123CD o ABC123)";
    if (!esEnteroEnRango(form.anio, 1950, new Date().getFullYear() + 1))
      nuevos.anio = `El año debe estar entre 1950 y ${new Date().getFullYear() + 1}`;
    if (!esNumeroPositivo(form.capacidadCarga))
      nuevos.capacidadCarga = "La capacidad debe ser un número mayor a 0";
    return nuevos;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorApi(null);

    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    // Editar = PUT sobre /vehiculos/:id. Crear = POST sobre /vehiculos
    const response = await fetchAuth(
      id ? `${API_URL}/vehiculos/${id}` : `${API_URL}/vehiculos`,
      {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          marca: form.marca.trim(),
          modelo: form.modelo.trim(),
          patente: form.patente.trim().toUpperCase(),
          anio: Number(form.anio), // el backend espera números, no texto
          capacidadCarga: Number(form.capacidadCarga),
        }),
      },
    );

    if (!response.ok) {
      const datos = await response.json();
      // Mostramos el primer error concreto del backend, o su mensaje general
      setErrorApi(datos.errores?.[0]?.msg || datos.mensaje || "No se pudo guardar");
      return;
    }

    navigate("/vehiculos");
  };

  return (
    <>
      <h2>{id ? "Modificar vehículo" : "Nuevo vehículo"}</h2>
      <form onSubmit={handleSubmit} noValidate>
        <label htmlFor="marca">Marca:</label>
        <input id="marca" value={form.marca} onChange={cambiar("marca")} />
        {errores.marca && <p className="error">{errores.marca}</p>}

        <label htmlFor="modelo">Modelo:</label>
        <input id="modelo" value={form.modelo} onChange={cambiar("modelo")} />
        {errores.modelo && <p className="error">{errores.modelo}</p>}

        <label htmlFor="patente">Patente:</label>
        <input id="patente" value={form.patente} onChange={cambiar("patente")} />
        {errores.patente && <p className="error">{errores.patente}</p>}

        <label htmlFor="anio">Año:</label>
        <input id="anio" type="number" value={form.anio} onChange={cambiar("anio")} />
        {errores.anio && <p className="error">{errores.anio}</p>}

        <label htmlFor="capacidadCarga">Capacidad de carga (kg):</label>
        <input
          id="capacidadCarga"
          type="number"
          value={form.capacidadCarga}
          onChange={cambiar("capacidadCarga")}
        />
        {errores.capacidadCarga && <p className="error">{errores.capacidadCarga}</p>}

        {errorApi && <p className="error">{errorApi}</p>}

        <div>
          <button type="submit">{id ? "Guardar cambios" : "Crear"}</button>
          <Link to="/vehiculos">
            <button type="button">Volver</button>
          </Link>
        </div>
      </form>
    </>
  );
}