-- Base de datos del TP3: gestión de vehículos, conductores y viajes
CREATE DATABASE IF NOT EXISTS tp3_programacion4;
-- Seleccionamos la base para que las tablas se creen dentro de ella
USE tp3_programacion4;

-- Usuarios de la aplicación (sirven para registrarse e iniciar sesión)
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,   -- UNIQUE: no pueden repetirse emails
  password VARCHAR(100) NOT NULL        -- acá se guarda el HASH de bcrypt, nunca la contraseña real
);

-- Vehículos de la empresa de transporte
CREATE TABLE IF NOT EXISTS vehiculos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  marca VARCHAR(50) NOT NULL,
  modelo VARCHAR(50) NOT NULL,
  patente VARCHAR(10) NOT NULL UNIQUE,  -- la patente identifica a un solo vehículo
  anio INT NOT NULL,
  capacidad_carga DECIMAL(10,2) NOT NULL -- en kilogramos
);

-- Conductores de la empresa
CREATE TABLE IF NOT EXISTS conductores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL,
  apellido VARCHAR(50) NOT NULL,
  numero_documento VARCHAR(20) NOT NULL UNIQUE,
  numero_licencia VARCHAR(20) NOT NULL UNIQUE,
  fecha_alta_licencia DATE NOT NULL,
  fecha_vencimiento_licencia DATE NOT NULL
);

-- Viajes realizados: cada uno asocia UN vehículo con UN conductor
CREATE TABLE IF NOT EXISTS viajes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehiculo_id INT NOT NULL,
  conductor_id INT NOT NULL,
  fecha_salida DATETIME NOT NULL,
  fecha_llegada DATETIME NOT NULL,
  origen VARCHAR(100) NOT NULL,
  destino VARCHAR(100) NOT NULL,
  kilometros DECIMAL(10,2) NOT NULL,
  observaciones VARCHAR(255) NULL,      -- opcional
  -- Claves foráneas: garantizan que el vehículo y el conductor existan
  -- y que no se pueda borrar uno que tenga viajes registrados
  FOREIGN KEY (vehiculo_id) REFERENCES vehiculos(id),
  FOREIGN KEY (conductor_id) REFERENCES conductores(id)
);