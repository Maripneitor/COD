import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

// Asegurarse de cargar el .env correcto
dotenv.config({ path: path.join(__dirname, '../../.env') });

const createTablesQuery = `
  -- Eliminar tablas si existen (para empezar desde cero)
  DROP TABLE IF EXISTS codigos CASCADE;
  DROP TABLE IF EXISTS objetos CASCADE;
  DROP TABLE IF EXISTS clases CASCADE;
  DROP TABLE IF EXISTS submodos CASCADE;
  DROP TABLE IF EXISTS modos CASCADE;

  -- 1. modos
  CREATE TABLE modos (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(10) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT
  );

  -- 2. submodos
  CREATE TABLE submodos (
    id SERIAL PRIMARY KEY,
    modo_id INTEGER NOT NULL REFERENCES modos(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    es_predeterminado BOOLEAN DEFAULT FALSE,
    orden SMALLINT DEFAULT 0
  );

  -- 3. clases
  CREATE TABLE clases (
    id SERIAL PRIMARY KEY,
    submodo_id INTEGER NOT NULL REFERENCES submodos(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL
  );

  -- 4. objetos
  CREATE TABLE objetos (
    id SERIAL PRIMARY KEY,
    clase_id INTEGER NOT NULL REFERENCES clases(id) ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    posicion SMALLINT,
    CONSTRAINT check_posicion CHECK (posicion BETWEEN 1 AND 7)
  );

  -- 5. codigos
  CREATE TABLE codigos (
    id SERIAL PRIMARY KEY,
    objeto_id INTEGER NOT NULL REFERENCES objetos(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    CONSTRAINT check_codigo_formato CHECK (codigo ~ '^[A-Za-z]+-[A-Za-z0-9]{10}$')
  );

  -- Insertar algunos datos base de prueba para validación rápida
  INSERT INTO modos (codigo, nombre, descripcion) VALUES ('MJ', 'Multijugador', 'Modo multijugador tradicional');
  INSERT INTO submodos (modo_id, nombre, es_predeterminado, orden) VALUES (1, 'Partida Rápida', true, 1);
  INSERT INTO clases (submodo_id, nombre) VALUES (1, 'Rifles de Asalto');
  INSERT INTO objetos (clase_id, nombre, posicion) VALUES (1, 'M4', 1);
  INSERT INTO codigos (objeto_id, codigo) VALUES (1, 'ARMA-A1B2C3D4E5');
`;

async function initDB() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('Conectando a la base de datos...');
    await client.connect();
    
    console.log('Ejecutando script de inicialización de tablas...');
    await client.query(createTablesQuery);
    
    console.log('✅ Tablas creadas correctamente según el nuevo esquema.');
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
  } finally {
    await client.end();
  }
}

initDB();
