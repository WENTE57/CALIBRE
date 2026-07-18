const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// 1. Asegurar la existencia del archivo .env a partir de .env.example
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('⚠️ El archivo .env no existe. Copiándolo a partir de .env.example...');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Archivo .env creado automáticamente.');
  } else {
    console.error('❌ Error: No se encontró el archivo .env.example para copiar.');
  }
}

// Cargar las variables de entorno
require('dotenv').config({ path: envPath });

const dbName = process.env.DB_DATABASE || 'calibre';

const verificarCrearBaseDatos = async () => {
  // Nos conectamos temporalmente a la base de datos por defecto 'postgres'
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: 'postgres',
  });

  try {
    await client.connect();
    // Verificar si la base de datos ya existe
    const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
    if (res.rowCount === 0) {
      console.log(`La base de datos "${dbName}" no existe. Creándola...`);
      // CREATE DATABASE no se puede parametrizar en PostgreSQL, por lo que interpolamos con seguridad
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Base de datos "${dbName}" creada con éxito.`);
    } else {
      console.log(`✅ La base de datos "${dbName}" ya existe.`);
    }
  } catch (err) {
    console.error('⚠️ Error al verificar/crear la base de datos:', err.message);
    console.log('Intentando continuar con la inicialización de tablas...');
  } finally {
    await client.end();
  }
};

const setup = async () => {
  // Aseguramos primero la base de datos
  await verificarCrearBaseDatos();

  // Importamos dinámicamente el pool de conexión una vez asegurada la base de datos y variables de entorno
  const pool = require('./db');

  try {
    console.log('Creando tabla de usuarios si no existe...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) UNIQUE NOT NULL,
        contrasena VARCHAR(255) NOT NULL,
        cargo VARCHAR(50) NOT NULL
      );
    `);
    
    const res = await pool.query('SELECT COUNT(*) FROM usuarios');
    if (parseInt(res.rows[0].count) === 0) {
      console.log('Insertando usuario de prueba...');
      await pool.query(`
        INSERT INTO usuarios (nombre, contrasena, cargo)
        VALUES ('Juan Perez', '123456', 'Administrador')
      `);
      console.log('✅ Usuario de prueba creado: Juan Perez / 123456');
    } else {
      console.log('✅ La tabla ya tiene usuarios.');
    }

    console.log('Creando tabla de categorias si no existe...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) UNIQUE NOT NULL
      );
    `);
    await pool.query("ALTER TABLE categorias ADD COLUMN IF NOT EXISTS emoji VARCHAR(50) DEFAULT '🏷️'");

    const resCat = await pool.query('SELECT COUNT(*) FROM categorias');
    if (parseInt(resCat.rows[0].count) === 0) {
      console.log('Insertando categorias de prueba...');
      await pool.query(`
        INSERT INTO categorias (nombre, emoji) VALUES
        ('General', '🍔'),
        ('Acompañamientos', '🍟'),
        ('Bebestibles', '🥤'),
        ('Otros', '🏷️')
      `);
      console.log('✅ Categorías de prueba creadas.');
    } else {
      console.log('✅ La tabla ya tiene categorías.');
    }

    console.log('Creando tabla de productos si no existe...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS productos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(150) UNIQUE NOT NULL,
        precio DECIMAL(10, 2) NOT NULL,
        imagen VARCHAR(255),
        categoria VARCHAR(100) DEFAULT 'Otros',
        activo BOOLEAN DEFAULT TRUE
      );
    `);

    // Aseguramos que las columnas necesarias existan
    await pool.query(`
      ALTER TABLE productos ADD COLUMN IF NOT EXISTS imagen VARCHAR(255);
    `);
    await pool.query(`
      ALTER TABLE productos ADD COLUMN IF NOT EXISTS categoria VARCHAR(100) DEFAULT 'Otros';
    `);

    const resProd = await pool.query('SELECT COUNT(*) FROM productos');
    if (parseInt(resProd.rows[0].count) === 0) {
      console.log('Insertando productos de prueba...');
      await pool.query(`
        INSERT INTO productos (nombre, precio, imagen, categoria) VALUES
        ('Hamburguesa Calibre', 5500.00, '🍔', 'General'),
        ('Hamburguesa Doble Queso', 6200.00, '🧀', 'General'),
        ('Papas Fritas Grandes', 3000.00, '🍟', 'Acompañamientos'),
        ('Bebida lata 350ml', 1500.00, '🥤', 'Bebestibles'),
        ('Aros de Cebolla', 2500.00, '🧅', 'Acompañamientos')
      `);
      console.log('✅ Productos de prueba creados.');
    } else {
      console.log('✅ La tabla ya tiene productos.');
    }

    console.log('Creando tabla de ingredientes si no existe...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ingredientes (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) UNIQUE NOT NULL,
        stock DECIMAL(10, 2) DEFAULT 0.00
      );
    `);

    const resIng = await pool.query('SELECT COUNT(*) FROM ingredientes');
    if (parseInt(resIng.rows[0].count) === 0) {
      console.log('Insertando ingredientes de prueba...');
      await pool.query(`
        INSERT INTO ingredientes (nombre, stock) VALUES
        ('Pan de Hamburguesa', 100),
        ('Carne de Res (gramos)', 5000),
        ('Queso Cheddar (rebanadas)', 200),
        ('Tomate', 50),
        ('Palta', 30),
        ('Salsa Calibre (gramos)', 1000)
      `);
      console.log('✅ Ingredientes de prueba creados.');
    } else {
      console.log('✅ La tabla ya tiene ingredientes.');
    }

    console.log('Creando tabla intermedia de producto_ingredientes si no existe...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS producto_ingredientes (
        producto_id INTEGER REFERENCES productos(id) ON DELETE CASCADE,
        ingrediente_id INTEGER REFERENCES ingredientes(id) ON DELETE CASCADE,
        cantidad DECIMAL(10, 2) DEFAULT 1.00,
        PRIMARY KEY (producto_id, ingrediente_id)
      );
    `);

    const resRel = await pool.query('SELECT COUNT(*) FROM producto_ingredientes');
    if (parseInt(resRel.rows[0].count) === 0) {
      console.log('Insertando relaciones de producto_ingredientes...');
      // Buscar productos e ingredientes para relacionarlos
      const prodsRes = await pool.query('SELECT id, nombre FROM productos');
      const ingsRes = await pool.query('SELECT id, nombre FROM ingredientes');

      const prodMap = {};
      prodsRes.rows.forEach(p => { prodMap[p.nombre] = p.id; });

      const ingMap = {};
      ingsRes.rows.forEach(i => { ingMap[i.nombre] = i.id; });

      // Hamburguesa Calibre
      const hCalibre = prodMap['Hamburguesa Calibre'];
      if (hCalibre) {
        if (ingMap['Pan de Hamburguesa']) {
          await pool.query('INSERT INTO producto_ingredientes (producto_id, ingrediente_id, cantidad) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [hCalibre, ingMap['Pan de Hamburguesa'], 1]);
        }
        if (ingMap['Carne de Res (gramos)']) {
          await pool.query('INSERT INTO producto_ingredientes (producto_id, ingrediente_id, cantidad) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [hCalibre, ingMap['Carne de Res (gramos)'], 120]);
        }
        if (ingMap['Queso Cheddar (rebanadas)']) {
          await pool.query('INSERT INTO producto_ingredientes (producto_id, ingrediente_id, cantidad) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [hCalibre, ingMap['Queso Cheddar (rebanadas)'], 1]);
        }
        if (ingMap['Tomate']) {
          await pool.query('INSERT INTO producto_ingredientes (producto_id, ingrediente_id, cantidad) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [hCalibre, ingMap['Tomate'], 1]);
        }
        if (ingMap['Salsa Calibre (gramos)']) {
          await pool.query('INSERT INTO producto_ingredientes (producto_id, ingrediente_id, cantidad) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [hCalibre, ingMap['Salsa Calibre (gramos)'], 20]);
        }
      }

      // Hamburguesa Doble Queso
      const hDobleQueso = prodMap['Hamburguesa Doble Queso'];
      if (hDobleQueso) {
        if (ingMap['Pan de Hamburguesa']) {
          await pool.query('INSERT INTO producto_ingredientes (producto_id, ingrediente_id, cantidad) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [hDobleQueso, ingMap['Pan de Hamburguesa'], 1]);
        }
        if (ingMap['Carne de Res (gramos)']) {
          await pool.query('INSERT INTO producto_ingredientes (producto_id, ingrediente_id, cantidad) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [hDobleQueso, ingMap['Carne de Res (gramos)'], 120]);
        }
        if (ingMap['Queso Cheddar (rebanadas)']) {
          await pool.query('INSERT INTO producto_ingredientes (producto_id, ingrediente_id, cantidad) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [hDobleQueso, ingMap['Queso Cheddar (rebanadas)'], 2]);
        }
      }
      console.log('✅ Relaciones de producto_ingredientes creadas.');
    } else {
      console.log('✅ La tabla producto_ingredientes ya tiene registros.');
    }

    console.log('Creando tabla de pedidos si no existe...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id SERIAL PRIMARY KEY,
        cliente_nombre VARCHAR(100) NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atendido_por VARCHAR(100) NOT NULL,
        nota TEXT,
        tipo_entrega VARCHAR(50) DEFAULT 'Servir',
        tipo_transaccion VARCHAR(50) DEFAULT 'Efectivo'
      );
    `);

    console.log('Creando tabla de pedido_productos si no existe...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pedido_productos (
        id SERIAL PRIMARY KEY,
        pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
        producto_id INTEGER,
        nombre_producto VARCHAR(150) NOT NULL,
        cantidad INTEGER NOT NULL,
        precio_unitario DECIMAL(10, 2) NOT NULL
      );
    `);
    console.log('✅ Tablas de pedidos y pedido_productos creadas.');

    console.log('Creando tabla de cierres_caja si no existe...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cierres_caja (
        id SERIAL PRIMARY KEY,
        fecha DATE UNIQUE NOT NULL,
        cierre_fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        cargado_por VARCHAR(100) NOT NULL,
        total_ventas DECIMAL(10, 2) NOT NULL,
        total_efectivo DECIMAL(10, 2) NOT NULL,
        total_tarjeta DECIMAL(10, 2) NOT NULL,
        fondo_apertura DECIMAL(10, 2) NOT NULL,
        efectivo_real DECIMAL(10, 2) NOT NULL,
        diferencia DECIMAL(10, 2) NOT NULL,
        observaciones TEXT
      );
    `);
    console.log('✅ Tabla cierres_caja asegurada.');
  } catch (err) {
    console.error('❌ Error configurando la base de datos:', err);
  } finally {
    await pool.end();
    process.exit();
  }
};

setup();
