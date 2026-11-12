# TP3 - Gestión de vehículos, conductores y viajes

Trabajo Práctico N.º 3 de **Programación IV** (UTN FRLR, Tecnicatura Universitaria en Programación).

Aplicación web para registrar los vehículos de una empresa de transporte, sus conductores y los viajes realizados, con consulta de historial y cálculo de kilómetros recorridos.

## Tecnologías

| Parte | Tecnologías |
|---|---|
| Frontend | Vite, React (JavaScript), React Router, CSS puro, `fetch` |
| Backend | Node.js, Express, `mysql2`, `express-validator` |
| Base de datos | MySQL |
| Seguridad | JWT (expira a las 4 horas), Passport (`passport-jwt`), `bcrypt` |

## Estructura del proyecto

```
tp3-programacion-iv/
├── backend/
│   ├── auth.js             # Registro, login y configuración de Passport
│   ├── conductores.js      # CRUD de conductores
│   ├── vehiculos.js        # CRUD de vehículos
│   ├── viajes.js           # CRUD de viajes, historial y total de km
│   ├── validaciones.js     # Validaciones con express-validator y middlewares
│   ├── db.js               # Conexión a MySQL
│   ├── index.js            # Servidor Express
│   ├── tablas.sql          # Definición de las tablas
│   ├── *.http              # Archivos de prueba de la API
│   └── .env.example        # Variables de entorno necesarias
└── frontend/
    └── src/
        ├── Auth.jsx        # Contexto de sesión (login, logout, fetch con token)
        ├── AuthLayout.jsx  # Protección de rutas
        ├── Layout.jsx      # Menú de navegación
        ├── Home.jsx, Login.jsx, Registro.jsx
        ├── Vehiculos.jsx, VehiculoFormulario.jsx
        ├── Conductores.jsx, ConductorFormulario.jsx
        ├── Viajes.jsx, ViajeFormulario.jsx
        ├── validaciones.js # Validaciones de formularios
        └── main.jsx        # Rutas de la aplicación
```

## Cómo ejecutarlo

### 1. Base de datos

Ejecutar el script `backend/tablas.sql` en MySQL. Crea la base `tp3_programacion4` y sus cuatro tablas.

### 2. Backend

```bash
cd backend
npm install
```

Copiar `.env.example` como `.env` y completar los datos de conexión y la clave del JWT. Luego:

```bash
npm run dev
```

La API queda en `http://localhost:3000`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

La aplicación queda en `http://localhost:5173`.

## API

Todas las rutas, salvo `/auth/*`, requieren el encabezado `Authorization: Bearer <token>`.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/auth/registro` | Crea un usuario (la contraseña se guarda con bcrypt) |
| POST | `/auth/login` | Devuelve un token JWT con vigencia de 4 horas |
| GET / POST | `/vehiculos` | Listar (filtros `marca`, `patente`) / crear |
| GET / PUT / DELETE | `/vehiculos/:id` | Ver / modificar / eliminar |
| GET / POST | `/conductores` | Listar (filtros `apellido`, `documento`) / crear |
| GET / PUT / DELETE | `/conductores/:id` | Ver / modificar / eliminar |
| GET / POST | `/viajes` | Historial (filtros `vehiculoId`, `conductorId`) / registrar |
| GET | `/viajes/kilometros` | Total de km y cantidad de viajes (mismos filtros) |
| GET / PUT / DELETE | `/viajes/:id` | Ver / modificar / eliminar |

Códigos de respuesta: `200` y `201` éxito, `204` eliminado, `400` datos inválidos, `401` sin autenticar, `404` no encontrado, `500` error del servidor.

## Decisiones de diseño

- **Autenticación**: el login devuelve un JWT firmado con una clave secreta; Passport lo verifica en cada ruta protegida.
- **Contraseñas**: nunca se guardan ni se devuelven en texto plano, solo el hash de bcrypt.
- **Integridad de datos**: un vehículo o conductor con viajes registrados no se puede eliminar. Al registrar un viaje se verifica que existan el vehículo y el conductor y que la licencia no estuviera vencida en la fecha de salida.
- **Validaciones**: se validan en el frontend (mejor experiencia) y de nuevo en el backend (seguridad), con mensajes claros.
- **Sesión en el frontend**: el token se guarda en `localStorage`; si el backend responde `401`, la sesión se cierra automáticamente.