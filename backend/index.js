const express = require('express');
const cors = require('cors');
const pool = require('./db');
const XLSX = require('xlsx');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json()); // Permite procesar peticiones JSON

// Asegurar columnas y tablas en la base de datos de manera automatizada
(async () => {
  try {
    // 1. Asegurar columna categoria y aplica_envase en productos
    await pool.query("ALTER TABLE productos ADD COLUMN IF NOT EXISTS categoria VARCHAR(100) DEFAULT 'Otros'");
    await pool.query("ALTER TABLE productos ADD COLUMN IF NOT EXISTS aplica_envase VARCHAR(20) DEFAULT 'heredar'");
    console.log("✅ Columnas 'categoria' y 'aplica_envase' aseguradas en la tabla productos.");

    // 2. Asegurar tabla categorias y cobra_envase
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) UNIQUE NOT NULL
      )
    `);
    await pool.query("ALTER TABLE categorias ADD COLUMN IF NOT EXISTS emoji VARCHAR(50) DEFAULT '🏷️'");
    await pool.query("ALTER TABLE categorias ADD COLUMN IF NOT EXISTS orden INT DEFAULT 0");
    await pool.query("ALTER TABLE categorias ADD COLUMN IF NOT EXISTS cobra_envase BOOLEAN DEFAULT TRUE");
    console.log("✅ Tabla 'categorias' asegurada.");

    // 3. Asegurar tabla pedidos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id SERIAL PRIMARY KEY,
        cliente_nombre VARCHAR(100),
        total DECIMAL(10, 2) NOT NULL,
        fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atendido_por VARCHAR(100) NOT NULL
      )
    `);
    await pool.query("ALTER TABLE pedidos ALTER COLUMN cliente_nombre DROP NOT NULL");
    await pool.query("ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS nota TEXT");
    await pool.query("ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS tipo_entrega VARCHAR(50) DEFAULT 'Servir'");
    await pool.query("ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS tipo_transaccion VARCHAR(50) DEFAULT 'Efectivo'");
    await pool.query("ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS monto_efectivo DECIMAL(10, 2) DEFAULT 0");
    await pool.query("ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS monto_debito DECIMAL(10, 2) DEFAULT 0");
    await pool.query("ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS monto_credito DECIMAL(10, 2) DEFAULT 0");
    await pool.query("ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS pago_mixto_detalle TEXT");
    await pool.query("ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cantidad_envases INT DEFAULT 0");
    await pool.query("ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS monto_envases DECIMAL(10, 2) DEFAULT 0");
    await pool.query("ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS eliminado BOOLEAN DEFAULT FALSE");
    await pool.query("ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS eliminado_por VARCHAR(100)");
    await pool.query("ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS eliminado_fecha TIMESTAMP");
    console.log("✅ Tabla 'pedidos' asegurada (con columnas de transacciones, envases y eliminación).");

    // 4. Asegurar tabla pedido_productos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pedido_productos (
        id SERIAL PRIMARY KEY,
        pedido_id INTEGER REFERENCES pedidos(id) ON DELETE CASCADE,
        producto_id INTEGER,
        nombre_producto VARCHAR(150) NOT NULL,
        cantidad INTEGER NOT NULL,
        precio_unitario DECIMAL(10, 2) NOT NULL
      )
    `);
    await pool.query("ALTER TABLE pedido_productos ADD COLUMN IF NOT EXISTS promocion_id INT");
    await pool.query("ALTER TABLE pedido_productos ADD COLUMN IF NOT EXISTS productos_incluidos JSONB");
    console.log("✅ Tabla 'pedido_productos' asegurada (con promocion_id y productos_incluidos).");

    // 5. Asegurar tipo decimal para stock en ingredientes
    await pool.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ingredientes') THEN
          ALTER TABLE ingredientes ALTER COLUMN stock TYPE DECIMAL(10, 2);
        END IF;
      END $$;
    `);
    console.log("✅ Columna 'stock' en la tabla ingredientes asegurada como DECIMAL.");

    // 6. Asegurar tabla cierres_caja
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
      )
    `);
    console.log("✅ Tabla 'cierres_caja' asegurada.");

    // 6.5 Asegurar tabla turnos y columna en pedidos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS turnos (
        id SERIAL PRIMARY KEY,
        fecha_hora_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_hora_fin TIMESTAMP,
        usuario_inicio VARCHAR(100) NOT NULL,
        usuario_fin VARCHAR(100),
        activo BOOLEAN DEFAULT TRUE,
        efectivo_inicial DECIMAL(10, 2) DEFAULT 0,
        efectivo_final DECIMAL(10, 2) DEFAULT 0
      )
    `);
    await pool.query("ALTER TABLE turnos ADD COLUMN IF NOT EXISTS efectivo_inicial DECIMAL(10, 2) DEFAULT 0");
    await pool.query("ALTER TABLE turnos ADD COLUMN IF NOT EXISTS efectivo_final DECIMAL(10, 2) DEFAULT 0");
    await pool.query("ALTER TABLE turnos ADD COLUMN IF NOT EXISTS total_ventas DECIMAL(10, 2) DEFAULT 0");
    await pool.query("ALTER TABLE turnos ADD COLUMN IF NOT EXISTS total_efectivo DECIMAL(10, 2) DEFAULT 0");
    await pool.query("ALTER TABLE turnos ADD COLUMN IF NOT EXISTS total_tarjeta DECIMAL(10, 2) DEFAULT 0");
    await pool.query("ALTER TABLE turnos ADD COLUMN IF NOT EXISTS diferencia DECIMAL(10, 2) DEFAULT 0");
    await pool.query("ALTER TABLE turnos ADD COLUMN IF NOT EXISTS observaciones TEXT");
    await pool.query("ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS turno_id INT REFERENCES turnos(id)");
    console.log("✅ Tabla 'turnos' y columna 'turno_id' en pedidos aseguradas con campos de efectivo y arqueo.");

    // 7. Asegurar tablas de promociones
    await pool.query(`
      CREATE TABLE IF NOT EXISTS promociones (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(150) UNIQUE NOT NULL,
        precio DECIMAL(10, 2) NOT NULL,
        activo BOOLEAN DEFAULT TRUE
      )
    `);
    await pool.query("ALTER TABLE promociones ADD COLUMN IF NOT EXISTS emoji VARCHAR(50) DEFAULT '🎁'");
    await pool.query("ALTER TABLE promociones ADD COLUMN IF NOT EXISTS aplica_envase VARCHAR(20) DEFAULT 'no'");
    await pool.query("ALTER TABLE promociones ADD COLUMN IF NOT EXISTS cantidad_envases INT DEFAULT 1");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS promocion_pasos (
        id SERIAL PRIMARY KEY,
        promocion_id INTEGER REFERENCES promociones(id) ON DELETE CASCADE,
        nombre_paso VARCHAR(150) NOT NULL,
        obligatorio BOOLEAN DEFAULT TRUE,
        autocalcular BOOLEAN DEFAULT TRUE
      )
    `);
    await pool.query("ALTER TABLE promocion_pasos ADD COLUMN IF NOT EXISTS autocalcular BOOLEAN DEFAULT TRUE");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS promocion_opciones (
        id SERIAL PRIMARY KEY,
        promocion_paso_id INTEGER REFERENCES promocion_pasos(id) ON DELETE CASCADE,
        producto_id INTEGER REFERENCES productos(id) ON DELETE CASCADE,
        precio_adicional DECIMAL(10, 2) DEFAULT 0.00
      )
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS promocion_productos_fijos (
        id SERIAL PRIMARY KEY,
        promocion_id INTEGER REFERENCES promociones(id) ON DELETE CASCADE,
        producto_id INTEGER REFERENCES productos(id) ON DELETE CASCADE,
        cantidad INTEGER DEFAULT 1
      )
    `);
    console.log("✅ Tablas de promociones ('promociones', 'promocion_productos_fijos', 'promocion_pasos', 'promocion_opciones') aseguradas.");

    // 8. Asegurar tabla configuracion y precio por defecto de envases
    await pool.query(`
      CREATE TABLE IF NOT EXISTS configuracion (
        clave VARCHAR(100) PRIMARY KEY,
        valor TEXT NOT NULL
      )
    `);
    await pool.query("INSERT INTO configuracion (clave, valor) VALUES ('precio_envase', '300') ON CONFLICT (clave) DO NOTHING");
    console.log("✅ Tabla 'configuracion' asegurada.");

    // Garantizar que la tabla productos y el producto 'Envase para llevar' existan
    await pool.query(`
      CREATE TABLE IF NOT EXISTS productos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(150) UNIQUE NOT NULL,
        precio DECIMAL(10, 2) NOT NULL,
        imagen VARCHAR(255),
        categoria VARCHAR(100) DEFAULT 'Otros',
        activo BOOLEAN DEFAULT TRUE,
        aplica_envase VARCHAR(20) DEFAULT 'heredar'
      )
    `);
    const envaseProdRes = await pool.query("SELECT id FROM productos WHERE nombre = 'Envase para llevar'");
    if (envaseProdRes.rows.length === 0) {
      const configRes = await pool.query("SELECT valor FROM configuracion WHERE clave = 'precio_envase'");
      const currentPrice = configRes.rows.length > 0 ? parseFloat(configRes.rows[0].valor) : 300;
      await pool.query(
        "INSERT INTO productos (nombre, precio, imagen, categoria, activo, aplica_envase) VALUES ('Envase para llevar', $1, '📦', 'Otros', true, 'no')",
        [currentPrice]
      );
      console.log("✅ Producto 'Envase para llevar' creado automáticamente.");
    }

    // 9. Asegurar tabla consumos_inventario
    await pool.query(`
      CREATE TABLE IF NOT EXISTS consumos_inventario (
        id SERIAL PRIMARY KEY,
        ingrediente_id INTEGER REFERENCES ingredientes(id) ON DELETE CASCADE,
        cantidad DECIMAL(10, 2) NOT NULL,
        fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        turno_id INTEGER
      )
    `);
    console.log("✅ Tabla 'consumos_inventario' asegurada.");

    // 10. Asegurar tabla entradas_inventario
    await pool.query(`
      CREATE TABLE IF NOT EXISTS entradas_inventario (
        id SERIAL PRIMARY KEY,
        ingrediente_id INTEGER REFERENCES ingredientes(id) ON DELETE CASCADE,
        cantidad DECIMAL(10, 2) NOT NULL,
        fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        turno_id INTEGER
      )
    `);
    console.log("✅ Tabla 'entradas_inventario' asegurada.");
  } catch (err) {
    console.error("❌ Error en la inicialización de la base de datos:", err.message);
  }
})();

// Endpoints de Configuración
app.get('/api/configuracion', async (req, res) => {
  try {
    const result = await pool.query('SELECT clave, valor FROM configuracion');
    const configObj = {};
    result.rows.forEach(row => {
      configObj[row.clave] = row.valor;
    });
    res.json({ success: true, configuracion: configObj });
  } catch (err) {
    console.error('Error en GET /api/configuracion:', err.message);
    res.status(500).json({ success: false, message: 'Error al obtener configuración.' });
  }
});

app.put('/api/configuracion', async (req, res) => {
  const { clave, valor } = req.body;
  if (!clave) {
    return res.status(400).json({ success: false, message: 'La clave de configuración es obligatoria.' });
  }
  try {
    await pool.query(
      'INSERT INTO configuracion (clave, valor) VALUES ($1, $2) ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor',
      [clave, String(valor)]
    );
    if (clave === 'precio_envase') {
      await pool.query(
        "UPDATE productos SET precio = $1 WHERE nombre = 'Envase para llevar'",
        [parseFloat(valor) || 0]
      );
      console.log(`✅ Precio del producto 'Envase para llevar' actualizado a ${valor}.`);
    }
    res.json({ success: true, message: 'Configuración actualizada con éxito.' });
  } catch (err) {
    console.error('Error en PUT /api/configuracion:', err.message);
    res.status(500).json({ success: false, message: 'Error al actualizar configuración.' });
  }
});

// Endpoints del Sistema de Turnos
app.get('/api/turnos/activo', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, fecha_hora_inicio, usuario_inicio, activo, efectivo_inicial::float as efectivo_inicial, efectivo_final::float as efectivo_final FROM turnos WHERE activo = TRUE LIMIT 1');
    if (result.rows.length > 0) {
      res.json({ success: true, activo: true, turno: result.rows[0] });
    } else {
      res.json({ success: true, activo: false, turno: null });
    }
  } catch (err) {
    console.error('Error en GET /api/turnos/activo:', err.message);
    res.status(500).json({ success: false, message: 'Error al verificar turno activo.' });
  }
});

app.post('/api/turnos/iniciar', async (req, res) => {
  const { usuario_inicio, efectivo_inicial } = req.body;
  if (!usuario_inicio) {
    return res.status(400).json({ success: false, message: 'El usuario de inicio es obligatorio.' });
  }
  if (efectivo_inicial === undefined || efectivo_inicial === null || isNaN(parseFloat(efectivo_inicial))) {
    return res.status(400).json({ success: false, message: 'El efectivo inicial es obligatorio y debe ser un número.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Cerrar cualquier turno previo que haya quedado activo
    await client.query(
      'UPDATE turnos SET activo = FALSE, fecha_hora_fin = CURRENT_TIMESTAMP, usuario_fin = $1 WHERE activo = TRUE',
      [usuario_inicio]
    );
    // Iniciar nuevo turno
    const result = await client.query(
      'INSERT INTO turnos (usuario_inicio, efectivo_inicial, activo) VALUES ($1, $2, TRUE) RETURNING id, fecha_hora_inicio, usuario_inicio, activo, efectivo_inicial::float as efectivo_inicial, efectivo_final::float as efectivo_final',
      [usuario_inicio, parseFloat(efectivo_inicial)]
    );
    await client.query('COMMIT');
    res.json({ success: true, message: 'Turno iniciado con éxito.', turno: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en POST /api/turnos/iniciar:', err.message);
    res.status(500).json({ success: false, message: 'Error al iniciar turno.' });
  } finally {
    client.release();
  }
});

app.post('/api/turnos/cerrar', async (req, res) => {
  const { usuario_fin, efectivo_final, observaciones } = req.body;
  if (!usuario_fin) {
    return res.status(400).json({ success: false, message: 'El usuario de cierre es obligatorio.' });
  }
  if (efectivo_final === undefined || efectivo_final === null || isNaN(parseFloat(efectivo_final))) {
    return res.status(400).json({ success: false, message: 'El efectivo final es obligatorio y debe ser un número.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Obtener el turno activo para saber su ID y efectivo_inicial
    const activeRes = await client.query('SELECT id, efectivo_inicial::FLOAT as efectivo_inicial, DATE(fecha_hora_inicio) as fecha_inicio FROM turnos WHERE activo = TRUE LIMIT 1');
    if (activeRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'No hay ningún turno activo para cerrar.' });
    }

    const activeShift = activeRes.rows[0];
    const eFinal = parseFloat(efectivo_final);

    // 2. Calcular ventas de este turno
    const salesRes = await client.query(`
      SELECT 
        COALESCE(SUM(total), 0)::FLOAT as total_ventas,
        COALESCE(SUM(CASE WHEN tipo_transaccion = 'Efectivo' THEN total WHEN tipo_transaccion = 'Mixto' THEN COALESCE(monto_efectivo, 0) ELSE 0 END), 0)::FLOAT as total_efectivo,
        COALESCE(SUM(CASE WHEN tipo_transaccion IN ('Débito', 'Crédito') THEN total WHEN tipo_transaccion = 'Mixto' THEN (COALESCE(monto_debito, 0) + COALESCE(monto_credito, 0)) ELSE 0 END), 0)::FLOAT as total_tarjeta
      FROM pedidos
      WHERE turno_id = $1 AND (eliminado IS FALSE OR eliminado IS NULL)
    `, [activeShift.id]);

    const sales = salesRes.rows[0];
    const dif = eFinal - (activeShift.efectivo_inicial + sales.total_efectivo);

    // 3. Cerrar el turno y guardar los datos del arqueo
    const result = await client.query(`
      UPDATE turnos 
      SET 
        activo = FALSE, 
        fecha_hora_fin = CURRENT_TIMESTAMP, 
        usuario_fin = $1, 
        efectivo_final = $2,
        total_ventas = $3,
        total_efectivo = $4,
        total_tarjeta = $5,
        diferencia = $6,
        observaciones = $7
      WHERE id = $8
      RETURNING id, fecha_hora_inicio, fecha_hora_fin, usuario_inicio, usuario_fin, 
                efectivo_inicial::float as efectivo_inicial, efectivo_final::float as efectivo_final,
                total_ventas::float as total_ventas, total_efectivo::float as total_efectivo,
                total_tarjeta::float as total_tarjeta, diferencia::float as diferencia, observaciones
    `, [usuario_fin, eFinal, sales.total_ventas, sales.total_efectivo, sales.total_tarjeta, dif, observaciones || '', activeShift.id]);

    // 4. Actualizar/Sincronizar cierres_caja para la fecha del turno
    const dateStr = activeShift.fecha_inicio.toISOString().split('T')[0];
    
    // Obtener los agregados de todos los turnos del día para guardar en cierres_caja
    const aggregatedRes = await client.query(`
      SELECT 
        COALESCE(SUM(total_ventas), 0)::FLOAT as total_ventas,
        COALESCE(SUM(total_efectivo), 0)::FLOAT as total_efectivo,
        COALESCE(SUM(total_tarjeta), 0)::FLOAT as total_tarjeta,
        COALESCE(SUM(efectivo_inicial), 0)::FLOAT as fondo_apertura,
        COALESCE(SUM(efectivo_final), 0)::FLOAT as efectivo_real,
        COALESCE(SUM(diferencia), 0)::FLOAT as diferencia,
        STRING_AGG(CASE WHEN observaciones <> '' THEN observaciones ELSE NULL END, ' | ') as observaciones
      FROM turnos
      WHERE DATE(fecha_hora_inicio) = $1
    `, [dateStr]);

    const agg = aggregatedRes.rows[0];

    await client.query(`
      INSERT INTO cierres_caja (
        fecha, cargado_por, total_ventas, total_efectivo, total_tarjeta, fondo_apertura, efectivo_real, diferencia, observaciones
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (fecha)
      DO UPDATE SET
        cierre_fecha_hora = CURRENT_TIMESTAMP,
        cargado_por = EXCLUDED.cargado_por,
        total_ventas = EXCLUDED.total_ventas,
        total_efectivo = EXCLUDED.total_efectivo,
        total_tarjeta = EXCLUDED.total_tarjeta,
        fondo_apertura = EXCLUDED.fondo_apertura,
        efectivo_real = EXCLUDED.efectivo_real,
        diferencia = EXCLUDED.diferencia,
        observaciones = EXCLUDED.observaciones
    `, [
      dateStr,
      usuario_fin,
      agg.total_ventas,
      agg.total_efectivo,
      agg.total_tarjeta,
      agg.fondo_apertura,
      agg.efectivo_real,
      agg.diferencia,
      agg.observaciones || ''
    ]);

    await client.query('COMMIT');

    // Enviar correo de inventario de forma asíncrona al cerrar el turno
    const { fork } = require('child_process');
    const path = require('path');
    try {
      const scriptPath = path.join(__dirname, 'comando_gmail.js');
      console.log(`[Backend] Enviando correo de inventario al cerrar turno: ${scriptPath}`);
      const child = fork(scriptPath, [String(activeShift.id)], { env: { ...process.env } });
      child.on('error', (err) => {
        console.error('[Backend] Error al ejecutar comando_gmail.js al cerrar turno:', err);
      });
      child.on('exit', (code) => {
        console.log(`[Backend] comando_gmail.js al cerrar turno finalizó con código: ${code}`);
      });
    } catch (err) {
      console.error('[Backend] Error al iniciar el envío de correo al cerrar turno:', err.message);
    }

    res.json({ success: true, message: 'Turno cerrado y arqueo registrado con éxito.', turno: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en POST /api/turnos/cerrar:', err.message);
    res.status(500).json({ success: false, message: 'Error al cerrar turno y registrar arqueo.' });
  } finally {
    client.release();
  }
});

app.put('/api/turnos/arqueo/:id', async (req, res) => {
  const { id } = req.params;
  const { efectivo_final, observaciones } = req.body;

  if (efectivo_final === undefined || efectivo_final === null || isNaN(parseFloat(efectivo_final))) {
    return res.status(400).json({ success: false, message: 'El efectivo final es obligatorio y debe ser un número.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Obtener datos del turno
    const shiftRes = await client.query('SELECT id, efectivo_inicial::FLOAT as efectivo_inicial, DATE(fecha_hora_inicio) as fecha_inicio, usuario_fin FROM turnos WHERE id = $1', [id]);
    if (shiftRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'El turno especificado no existe.' });
    }

    const shift = shiftRes.rows[0];
    const eFinal = parseFloat(efectivo_final);

    // 2. Recalcular ventas
    const salesRes = await client.query(`
      SELECT 
        COALESCE(SUM(total), 0)::FLOAT as total_ventas,
        COALESCE(SUM(CASE WHEN tipo_transaccion = 'Efectivo' THEN total WHEN tipo_transaccion = 'Mixto' THEN COALESCE(monto_efectivo, 0) ELSE 0 END), 0)::FLOAT as total_efectivo,
        COALESCE(SUM(CASE WHEN tipo_transaccion IN ('Débito', 'Crédito') THEN total WHEN tipo_transaccion = 'Mixto' THEN (COALESCE(monto_debito, 0) + COALESCE(monto_credito, 0)) ELSE 0 END), 0)::FLOAT as total_tarjeta
      FROM pedidos
      WHERE turno_id = $1 AND (eliminado IS FALSE OR eliminado IS NULL)
    `, [id]);

    const sales = salesRes.rows[0];
    const dif = eFinal - (shift.efectivo_inicial + sales.total_efectivo);

    // 3. Actualizar turno
    const result = await client.query(`
      UPDATE turnos 
      SET 
        efectivo_final = $1,
        diferencia = $2,
        observaciones = $3
      WHERE id = $4
      RETURNING id, fecha_hora_inicio, fecha_hora_fin, usuario_inicio, usuario_fin, 
                efectivo_inicial::float as efectivo_inicial, efectivo_final::float as efectivo_final,
                total_ventas::float as total_ventas, total_efectivo::float as total_efectivo,
                total_tarjeta::float as total_tarjeta, diferencia::float as diferencia, observaciones
    `, [eFinal, dif, observaciones || '', id]);

    // 4. Sincronizar cierres_caja
    const dateStr = shift.fecha_inicio.toISOString().split('T')[0];
    const aggregatedRes = await client.query(`
      SELECT 
        COALESCE(SUM(total_ventas), 0)::FLOAT as total_ventas,
        COALESCE(SUM(total_efectivo), 0)::FLOAT as total_efectivo,
        COALESCE(SUM(total_tarjeta), 0)::FLOAT as total_tarjeta,
        COALESCE(SUM(efectivo_inicial), 0)::FLOAT as fondo_apertura,
        COALESCE(SUM(efectivo_final), 0)::FLOAT as efectivo_real,
        COALESCE(SUM(diferencia), 0)::FLOAT as diferencia,
        STRING_AGG(CASE WHEN observaciones <> '' THEN observaciones ELSE NULL END, ' | ') as observaciones
      FROM turnos
      WHERE DATE(fecha_hora_inicio) = $1
    `, [dateStr]);

    const agg = aggregatedRes.rows[0];

    await client.query(`
      INSERT INTO cierres_caja (
        fecha, cargado_por, total_ventas, total_efectivo, total_tarjeta, fondo_apertura, efectivo_real, diferencia, observaciones
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (fecha)
      DO UPDATE SET
        cierre_fecha_hora = CURRENT_TIMESTAMP,
        cargado_por = EXCLUDED.cargado_por,
        total_ventas = EXCLUDED.total_ventas,
        total_efectivo = EXCLUDED.total_efectivo,
        total_tarjeta = EXCLUDED.total_tarjeta,
        fondo_apertura = EXCLUDED.fondo_apertura,
        efectivo_real = EXCLUDED.efectivo_real,
        diferencia = EXCLUDED.diferencia,
        observaciones = EXCLUDED.observaciones
    `, [
      dateStr,
      shift.usuario_fin || 'Sistema',
      agg.total_ventas,
      agg.total_efectivo,
      agg.total_tarjeta,
      agg.fondo_apertura,
      agg.efectivo_real,
      agg.diferencia,
      agg.observaciones || ''
    ]);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Arqueo corregido con éxito.', turno: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en PUT /api/turnos/arqueo/:id:', err.message);
    res.status(500).json({ success: false, message: 'Error al actualizar el arqueo del turno.' });
  } finally {
    client.release();
  }
});

app.get('/api/turnos', async (req, res) => {
  try {
    const query = `
      SELECT 
        t.id,
        t.fecha_hora_inicio,
        t.fecha_hora_fin,
        t.usuario_inicio,
        t.usuario_fin,
        t.activo,
        t.efectivo_inicial::float as efectivo_inicial,
        t.efectivo_final::float as efectivo_final,
        t.diferencia::float as diferencia,
        t.observaciones,
        COALESCE(SUM(p.total), 0)::float AS total_ventas,
        COALESCE(SUM(p.monto_efectivo), 0)::float AS total_efectivo,
        COALESCE(SUM(p.monto_debito), 0)::float AS total_debito,
        COALESCE(SUM(p.monto_credito), 0)::float AS total_credito,
        COALESCE(SUM(p.monto_envases), 0)::float AS total_envases,
        COUNT(p.id)::int AS cantidad_pedidos
      FROM turnos t
      LEFT JOIN pedidos p ON p.turno_id = t.id AND (p.eliminado IS FALSE OR p.eliminado IS NULL)
      GROUP BY t.id, t.efectivo_inicial, t.efectivo_final, t.diferencia, t.observaciones
      ORDER BY t.id DESC
      LIMIT 10
    `;
    const result = await pool.query(query);
    res.json({ success: true, turnos: result.rows });
  } catch (err) {
    console.error('Error en GET /api/turnos:', err.message);
    res.status(500).json({ success: false, message: 'Error al obtener turnos.' });
  }
});

// Endpoint de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'El servidor del backend está corriendo correctamente.' });
});

// Endpoint de Login
app.post('/api/login', async (req, res) => {
  const { nombre, contrasena } = req.body;

  // Validación básica de campos vacíos
  if (!nombre || !contrasena) {
    return res.status(400).json({ 
      success: false, 
      message: 'Por favor, ingresa tanto el nombre como la contraseña.' 
    });
  }

  try {
    // Buscamos el usuario por su nombre
    // NOTA: Para producción se recomienda encriptar la contraseña con bcrypt y comparar el hash.
    const result = await pool.query(
      'SELECT id, nombre, contrasena, cargo FROM usuarios WHERE nombre = $1',
      [nombre]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'El usuario no existe.' 
      });
    }

    const usuario = result.rows[0];

    // Comparamos contraseña en texto plano (según el requerimiento básico actual)
    if (usuario.contrasena !== contrasena) {
      return res.status(401).json({ 
        success: false, 
        message: 'Contraseña incorrecta.' 
      });
    }

    // Login exitoso
    res.json({
      success: true,
      message: 'Inicio de sesión exitoso.',
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        cargo: usuario.cargo
      }
    });

  } catch (err) {
    console.error('Error en /api/login:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor al procesar el login.' 
    });
  }
});

// Endpoint de Shortcut para ingresar al primer usuario administrador (A+P+L+T)
app.post('/api/login/admin-first', async (req, res) => {
  try {
    // Buscar el primer usuario cuyo cargo sea Administrador
    let result = await pool.query(
      "SELECT id, nombre, cargo FROM usuarios WHERE LOWER(cargo) = 'administrador' ORDER BY id ASC LIMIT 1"
    );

    if (result.rows.length === 0) {
      // Si no hay administradores explícitos, tomar el primer usuario de la tabla
      result = await pool.query(
        "SELECT id, nombre, cargo FROM usuarios ORDER BY id ASC LIMIT 1"
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No existen usuarios en la base de datos.'
      });
    }

    const adminUser = result.rows[0];
    res.json({
      success: true,
      message: `Inicio de sesión automático como ${adminUser.nombre}.`,
      user: {
        id: adminUser.id,
        nombre: adminUser.nombre,
        cargo: adminUser.cargo
      }
    });
  } catch (err) {
    console.error('Error en /api/login/admin-first:', err.message);
    res.status(500).json({
      success: false,
      message: 'Error interno al buscar el usuario administrador.'
    });
  }
});

// Endpoint de Registro de Usuarios
app.post('/api/usuarios', async (req, res) => {
  const { nombre, contrasena, cargo } = req.body;

  // Validación básica de campos vacíos
  if (!nombre || !contrasena || !cargo) {
    return res.status(400).json({
      success: false,
      message: 'Por favor, completa todos los campos (nombre, contraseña y cargo).'
    });
  }

  const cargoTrimmed = cargo.trim();
  if (cargoTrimmed !== 'Administrador' && cargoTrimmed !== 'Usuario') {
    return res.status(400).json({
      success: false,
      message: 'El cargo debe ser "Administrador" o "Usuario".'
    });
  }

  try {
    // Comprobar si el nombre ya está registrado
    const userExist = await pool.query(
      'SELECT id FROM usuarios WHERE nombre = $1',
      [nombre.trim()]
    );

    if (userExist.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario ya está registrado.'
      });
    }

    // Insertar el nuevo usuario
    await pool.query(
      'INSERT INTO usuarios (nombre, contrasena, cargo) VALUES ($1, $2, $3)',
      [nombre.trim(), contrasena.trim(), cargoTrimmed]
    );

    res.status(201).json({
      success: true,
      message: `Usuario "${nombre.trim()}" registrado con éxito.`
    });

  } catch (err) {
    console.error('Error en POST /api/usuarios:', err.message);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al registrar el usuario.'
    });
  }
});


// Endpoint de Obtener Productos (con sus ingredientes)
app.get('/api/productos', async (req, res) => {
  try {
    const queryStr = `
      SELECT 
        p.id, 
        p.nombre, 
        p.precio, 
        p.imagen, 
        p.categoria,
        COALESCE(p.aplica_envase, 'heredar') AS aplica_envase,
        COALESCE(
          json_agg(
            json_build_object(
              'id', i.id,
              'nombre', i.nombre,
              'cantidad', pi.cantidad
            )
          ) FILTER (WHERE i.id IS NOT NULL), 
          '[]'
        ) AS ingredientes,
        COALESCE(sales.total_ventas, 0) AS total_ventas
      FROM productos p
      LEFT JOIN producto_ingredientes pi ON p.id = pi.producto_id
      LEFT JOIN ingredientes i ON pi.ingrediente_id = i.id
      LEFT JOIN (
        SELECT pp.producto_id, SUM(pp.cantidad) AS total_ventas
        FROM pedido_productos pp
        JOIN pedidos ped ON pp.pedido_id = ped.id
        WHERE ped.eliminado = false OR ped.eliminado IS NULL
        GROUP BY pp.producto_id
      ) sales ON p.id = sales.producto_id
      WHERE p.activo = true
      GROUP BY p.id, sales.total_ventas
      ORDER BY COALESCE(sales.total_ventas, 0) DESC, p.id ASC;
    `;
    const result = await pool.query(queryStr);
    res.json({
      success: true,
      productos: result.rows
    });
  } catch (err) {
    console.error('Error en GET /api/productos:', err.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los productos de la base de datos.'
    });
  }
});


// Endpoint de Obtener Promociones
app.get('/api/promociones', async (req, res) => {
  try {
    const query = `
      SELECT 
        pr.id,
        pr.nombre,
        pr.precio,
        pr.activo,
        pr.emoji,
        COALESCE(pr.aplica_envase, 'no') AS aplica_envase,
        COALESCE(pr.cantidad_envases, 1) AS cantidad_envases,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', pf.id,
                'producto_id', pf.producto_id,
                'nombre_producto', prod_fijo.nombre,
                'precio_producto', prod_fijo.precio,
                'cantidad', pf.cantidad
              )
              ORDER BY pf.id ASC
            )
            FROM promocion_productos_fijos pf
            JOIN productos prod_fijo ON pf.producto_id = prod_fijo.id
            WHERE pf.promocion_id = pr.id
          ),
          '[]'::json
        ) AS productos_fijos,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', pa.id,
                'nombre_paso', pa.nombre_paso,
                'obligatorio', pa.obligatorio,
                'autocalcular', COALESCE(pa.autocalcular, true),
                'opciones', COALESCE(
                  (
                    SELECT json_agg(
                      json_build_object(
                        'id', op.id,
                        'producto_id', op.producto_id,
                        'precio_adicional', op.precio_adicional,
                        'nombre_producto', prod.nombre,
                        'precio_producto', prod.precio
                      )
                    )
                    FROM promocion_opciones op
                    JOIN productos prod ON op.producto_id = prod.id
                    WHERE op.promocion_paso_id = pa.id
                  ),
                  '[]'::json
                )
              )
              ORDER BY pa.id ASC
            )
            FROM promocion_pasos pa
            WHERE pa.promocion_id = pr.id
          ),
          '[]'::json
        ) AS pasos
      FROM promociones pr
      ORDER BY pr.id ASC;
    `;
    const result = await pool.query(query);
    res.json({ success: true, promociones: result.rows });
  } catch (err) {
    console.error('Error en GET /api/promociones:', err.message);
    res.status(500).json({ success: false, message: 'Error al obtener promociones.' });
  }
});

// Endpoint de Crear Promoción
app.post('/api/promociones', async (req, res) => {
  const { nombre, precio, pasos, productos_fijos, emoji, aplica_envase, cantidad_envases } = req.body;
  if (!nombre || precio === undefined) {
    return res.status(400).json({ success: false, message: 'Nombre y precio son obligatorios.' });
  }
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const promoRes = await client.query(
      'INSERT INTO promociones (nombre, precio, emoji, aplica_envase, cantidad_envases) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [nombre.trim(), precio, emoji || '🎁', aplica_envase || 'no', parseInt(cantidad_envases) || 1]
    );
    const promoId = promoRes.rows[0].id;
    
    // Insertar productos fijos
    if (productos_fijos && Array.isArray(productos_fijos)) {
      for (const pf of productos_fijos) {
        if (pf.producto_id) {
          await client.query(
            'INSERT INTO promocion_productos_fijos (promocion_id, producto_id, cantidad) VALUES ($1, $2, $3)',
            [promoId, pf.producto_id, parseInt(pf.cantidad) || 1]
          );
        }
      }
    }

    // Insertar pasos y opciones
    if (pasos && Array.isArray(pasos)) {
      for (const paso of pasos) {
        const pasoRes = await client.query(
          'INSERT INTO promocion_pasos (promocion_id, nombre_paso, obligatorio, autocalcular) VALUES ($1, $2, $3, $4) RETURNING id',
          [promoId, paso.nombre_paso.trim(), paso.obligatorio !== false, paso.autocalcular !== false]
        );
        const pasoId = pasoRes.rows[0].id;
        
        if (paso.opciones && Array.isArray(paso.opciones)) {
          for (const opcion of paso.opciones) {
            await client.query(
              'INSERT INTO promocion_opciones (promocion_paso_id, producto_id, precio_adicional) VALUES ($1, $2, $3)',
              [pasoId, opcion.producto_id, opcion.precio_adicional || 0.00]
            );
          }
        }
      }
    }
    
    await client.query('COMMIT');
    res.json({ success: true, message: 'Promoción creada con éxito.', id: promoId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en POST /api/promociones:', err.message);
    res.status(500).json({ success: false, message: 'Error al crear la promoción.' });
  } finally {
    client.release();
  }
});

// Endpoint de Editar Promoción
app.put('/api/promociones/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, precio, activo, pasos, productos_fijos, emoji, aplica_envase, cantidad_envases } = req.body;
  
  if (!nombre || precio === undefined) {
    return res.status(400).json({ success: false, message: 'Nombre y precio son obligatorios.' });
  }
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(
      'UPDATE promociones SET nombre = $1, precio = $2, activo = $3, emoji = $4, aplica_envase = $5, cantidad_envases = $6 WHERE id = $7',
      [nombre.trim(), precio, activo !== false, emoji || '🎁', aplica_envase || 'no', parseInt(cantidad_envases) || 1, id]
    );
    
    // Borrar productos fijos antiguos e reinsertar
    await client.query('DELETE FROM promocion_productos_fijos WHERE promocion_id = $1', [id]);
    if (productos_fijos && Array.isArray(productos_fijos)) {
      for (const pf of productos_fijos) {
        if (pf.producto_id) {
          await client.query(
            'INSERT INTO promocion_productos_fijos (promocion_id, producto_id, cantidad) VALUES ($1, $2, $3)',
            [id, pf.producto_id, parseInt(pf.cantidad) || 1]
          );
        }
      }
    }

    // Borrar pasos antiguos (las opciones se borran en cascada automáticamente)
    await client.query('DELETE FROM promocion_pasos WHERE promocion_id = $1', [id]);
    
    if (pasos && Array.isArray(pasos)) {
      for (const paso of pasos) {
        const pasoRes = await client.query(
          'INSERT INTO promocion_pasos (promocion_id, nombre_paso, obligatorio, autocalcular) VALUES ($1, $2, $3, $4) RETURNING id',
          [id, paso.nombre_paso.trim(), paso.obligatorio !== false, paso.autocalcular !== false]
        );
        const pasoId = pasoRes.rows[0].id;
        
        if (paso.opciones && Array.isArray(paso.opciones)) {
          for (const opcion of paso.opciones) {
            await client.query(
              'INSERT INTO promocion_opciones (promocion_paso_id, producto_id, precio_adicional) VALUES ($1, $2, $3)',
              [pasoId, opcion.producto_id, opcion.precio_adicional || 0.00]
            );
          }
        }
      }
    }
    
    await client.query('COMMIT');
    res.json({ success: true, message: 'Promoción actualizada con éxito.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en PUT /api/promociones:', err.message);
    res.status(500).json({ success: false, message: 'Error al actualizar la promoción.' });
  } finally {
    client.release();
  }
});

// Endpoint de Eliminar Promoción
app.delete('/api/promociones/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM promociones WHERE id = $1', [id]);
    res.json({ success: true, message: 'Promoción eliminada con éxito.' });
  } catch (err) {
    console.error('Error en DELETE /api/promociones:', err.message);
    res.status(500).json({ success: false, message: 'Error al eliminar la promoción.' });
  }
});


// Endpoint de Obtener Usuarios (para administración)
app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, cargo FROM usuarios ORDER BY id ASC'
    );
    res.json({
      success: true,
      usuarios: result.rows
    });
  } catch (err) {
    console.error('Error en GET /api/usuarios:', err.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los usuarios de la base de datos.'
    });
  }
});

// Endpoint de Eliminar Usuario (para administración)
app.delete('/api/usuarios/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM usuarios WHERE id = $1 RETURNING id, nombre',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'El usuario no existe.'
      });
    }

    res.json({
      success: true,
      message: `Usuario "${result.rows[0].nombre}" eliminado correctamente.`
    });
  } catch (err) {
    console.error('Error en DELETE /api/usuarios:', err.message);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el usuario de la base de datos.'
    });
  }
});


// Endpoint de Crear Producto (con transacción para asociar ingredientes)
app.post('/api/productos', async (req, res) => {
  const { nombre, precio, imagen, categoria, ingredientes, aplica_envase } = req.body; // ingredientes: [{ ingrediente_id, cantidad }]

  // Validación básica
  if (!nombre || !precio) {
    return res.status(400).json({
      success: false,
      message: 'Por favor, completa los campos obligatorios (nombre y precio).'
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Comprobar si el producto ya está registrado
    const prodExist = await client.query(
      'SELECT id FROM productos WHERE nombre = $1',
      [nombre.trim()]
    );

    if (prodExist.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Ya existe un producto registrado con este nombre.'
      });
    }

    // Insertar el nuevo producto
    const result = await client.query(
      'INSERT INTO productos (nombre, precio, imagen, categoria, activo, aplica_envase) VALUES ($1, $2, $3, $4, true, $5) RETURNING id, nombre',
      [nombre.trim(), parseFloat(precio), imagen ? imagen.trim() : '🍔', categoria ? categoria.trim() : 'Otros', aplica_envase || 'heredar']
    );
    const nuevoProductoId = result.rows[0].id;

    // Insertar asociaciones de ingredientes
    if (ingredientes && Array.isArray(ingredientes) && ingredientes.length > 0) {
      for (const ing of ingredientes) {
        await client.query(
          'INSERT INTO producto_ingredientes (producto_id, ingrediente_id, cantidad) VALUES ($1, $2, $3)',
          [nuevoProductoId, parseInt(ing.ingrediente_id), parseFloat(ing.cantidad)]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: `Producto "${result.rows[0].nombre}" registrado con éxito.`,
      product: result.rows[0]
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en POST /api/productos:', err.message);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al registrar el producto.'
    });
  } finally {
    client.release();
  }
});

// Endpoint de Editar Producto (con transacción para actualizar ingredientes)
app.put('/api/productos/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, precio, imagen, categoria, ingredientes, aplica_envase } = req.body;

  // Validación básica
  if (!nombre || !precio) {
    return res.status(400).json({
      success: false,
      message: 'Por favor, completa los campos obligatorios (nombre y precio).'
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Comprobar si el producto existe
    const prodCheck = await client.query('SELECT id, nombre FROM productos WHERE id = $1', [id]);
    if (prodCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'El producto no existe.' });
    }

    const nombreNuevo = nombre.trim();
    // Comprobar si el nuevo nombre ya está ocupado por otro producto
    const nameExist = await client.query('SELECT id FROM productos WHERE nombre = $1 AND id <> $2', [nombreNuevo, id]);
    if (nameExist.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Ya existe otro producto registrado con este nombre.' });
    }

    // Actualizar producto en la tabla productos
    await client.query(
      'UPDATE productos SET nombre = $1, precio = $2, imagen = $3, categoria = $4, aplica_envase = $5 WHERE id = $6',
      [nombreNuevo, parseFloat(precio), imagen ? imagen.trim() : '🍔', categoria ? categoria.trim() : 'Otros', aplica_envase || 'heredar', id]
    );

    // Eliminar asociaciones de ingredientes previas
    await client.query('DELETE FROM producto_ingredientes WHERE producto_id = $1', [id]);

    // Insertar nuevas asociaciones de ingredientes
    if (ingredientes && Array.isArray(ingredientes) && ingredientes.length > 0) {
      for (const ing of ingredientes) {
        await client.query(
          'INSERT INTO producto_ingredientes (producto_id, ingrediente_id, cantidad) VALUES ($1, $2, $3)',
          [id, parseInt(ing.ingrediente_id), parseFloat(ing.cantidad)]
        );
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Producto "${nombreNuevo}" actualizado con éxito.`
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en PUT /api/productos:', err.message);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al actualizar el producto.'
    });
  } finally {
    client.release();
  }
});

// Endpoint de Eliminar Producto (para administración)
app.delete('/api/productos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM productos WHERE id = $1 RETURNING id, nombre',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'El producto no existe.'
      });
    }

    res.json({
      success: true,
      message: `Producto "${result.rows[0].nombre}" eliminado correctamente.`
    });
  } catch (err) {
    console.error('Error en DELETE /api/productos:', err.message);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el producto de la base de datos.'
    });
  }
});

// Endpoint de Obtener Ingredientes (para administración)
app.get('/api/ingredientes', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, stock FROM ingredientes ORDER BY nombre ASC'
    );
    res.json({
      success: true,
      ingredientes: result.rows
    });
  } catch (err) {
    console.error('Error en GET /api/ingredientes:', err.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los ingredientes de la base de datos.'
    });
  }
});

// Endpoint de Crear Ingrediente (para administración)
app.post('/api/ingredientes', async (req, res) => {
  const { nombre, stock } = req.body;
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({
      success: false,
      message: 'El nombre del ingrediente es obligatorio.'
    });
  }
  try {
    const exist = await pool.query('SELECT id FROM ingredientes WHERE nombre = $1', [nombre.trim()]);
    if (exist.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un ingrediente con este nombre.'
      });
    }
    const result = await pool.query(
      'INSERT INTO ingredientes (nombre, stock) VALUES ($1, $2) RETURNING id, nombre, stock',
      [nombre.trim(), parseFloat(stock) || 0.0]
    );
    res.status(201).json({
      success: true,
      message: `Ingrediente "${result.rows[0].nombre}" creado con éxito.`,
      ingrediente: result.rows[0]
    });
  } catch (err) {
    console.error('Error en POST /api/ingredientes:', err.message);
    res.status(500).json({
      success: false,
      message: 'Error al registrar el ingrediente en la base de datos.'
    });
  }
});

// Endpoint de Editar Ingrediente (para administración)
app.put('/api/ingredientes/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, stock } = req.body;
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({
      success: false,
      message: 'El nombre del ingrediente es obligatorio.'
    });
  }
  try {
    // Comprobar duplicado si cambia nombre
    const ingRes = await pool.query('SELECT nombre FROM ingredientes WHERE id = $1', [id]);
    if (ingRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'El ingrediente no existe.'
      });
    }
    const nombreAntiguo = ingRes.rows[0].nombre;
    const nombreNuevo = nombre.trim();

    if (nombreAntiguo !== nombreNuevo) {
      const dupRes = await pool.query('SELECT id FROM ingredientes WHERE nombre = $1', [nombreNuevo]);
      if (dupRes.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro ingrediente con este nombre.'
        });
      }
    }

    const result = await pool.query(
      'UPDATE ingredientes SET nombre = $1, stock = $2 WHERE id = $3 RETURNING id, nombre, stock',
      [nombreNuevo, parseFloat(stock) || 0.0, id]
    );

    res.json({
      success: true,
      message: `Ingrediente actualizado con éxito.`,
      ingrediente: result.rows[0]
    });
  } catch (err) {
    console.error('Error en PUT /api/ingredientes:', err.message);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el ingrediente.'
    });
  }
});

// Endpoint para registrar llegada de materia prima (adicionar stock a un ingrediente)
app.post('/api/ingredientes/:id/llegada', async (req, res) => {
  const { id } = req.params;
  const { cantidad, turno_id } = req.body;
  const cantidadNum = parseFloat(cantidad);
  if (isNaN(cantidadNum) || cantidadNum <= 0) {
    return res.status(400).json({
      success: false,
      message: 'La cantidad que llegó debe ser un número válido mayor a 0.'
    });
  }
  try {
    await pool.query('BEGIN');

    const result = await pool.query(
      'UPDATE ingredientes SET stock = stock + $1 WHERE id = $2 RETURNING id, nombre, stock',
      [cantidadNum, id]
    );
    if (result.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'El ingrediente no existe.'
      });
    }

    let parsedTurnoId = parseInt(turno_id, 10);
    if (isNaN(parsedTurnoId)) parsedTurnoId = null;

    await pool.query(
      'INSERT INTO entradas_inventario (ingrediente_id, cantidad, turno_id) VALUES ($1, $2, $3)',
      [id, cantidadNum, parsedTurnoId]
    );

    await pool.query('COMMIT');

    res.json({
      success: true,
      message: `Llegada registrada: se añadieron ${cantidadNum} unidades a "${result.rows[0].nombre}".`,
      ingrediente: result.rows[0]
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error en POST /api/ingredientes/:id/llegada:', err.message);
    res.status(500).json({
      success: false,
      message: 'Error al registrar la llegada de materia prima.'
    });
  }
});

// Endpoint para registrar consumo interno / merma (descontar stock de un ingrediente)
app.post('/api/ingredientes/:id/consumo', async (req, res) => {
  const { id } = req.params;
  const { cantidad, turno_id } = req.body;
  const cantidadNum = parseFloat(cantidad);
  if (isNaN(cantidadNum) || cantidadNum <= 0) {
    return res.status(400).json({
      success: false,
      message: 'La cantidad a descontar debe ser un número válido mayor a 0.'
    });
  }
  try {
    await pool.query('BEGIN');

    const result = await pool.query(
      'UPDATE ingredientes SET stock = GREATEST(0, stock - $1) WHERE id = $2 RETURNING id, nombre, stock',
      [cantidadNum, id]
    );
    if (result.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'El ingrediente no existe.'
      });
    }

    let parsedTurnoId = parseInt(turno_id, 10);
    if (isNaN(parsedTurnoId)) parsedTurnoId = null;

    await pool.query(
      'INSERT INTO consumos_inventario (ingrediente_id, cantidad, turno_id) VALUES ($1, $2, $3)',
      [id, cantidadNum, parsedTurnoId]
    );

    await pool.query('COMMIT');

    res.json({
      success: true,
      message: `Consumo/Merma registrado: se descontaron ${cantidadNum} unidades de "${result.rows[0].nombre}".`,
      ingrediente: result.rows[0]
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error en POST /api/ingredientes/:id/consumo:', err.message);
    res.status(500).json({
      success: false,
      message: 'Error al registrar el consumo/merma.'
    });
  }
});

// Endpoint de Eliminar Ingrediente (para administración)
app.delete('/api/ingredientes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM ingredientes WHERE id = $1 RETURNING id, nombre', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'El ingrediente no existe.'
      });
    }
    res.json({
      success: true,
      message: `Ingrediente "${result.rows[0].nombre}" eliminado correctamente.`
    });
  } catch (err) {
    console.error('Error en DELETE /api/ingredientes:', err.message);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el ingrediente de la base de datos.'
    });
  }
});

// Endpoint de Obtener Categorías
app.get('/api/categorias', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre, emoji, orden, cobra_envase FROM categorias ORDER BY orden ASC, nombre ASC');
    res.json({
      success: true,
      categorias: result.rows
    });
  } catch (err) {
    console.error('Error en GET /api/categorias:', err.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las categorías de la base de datos.'
    });
  }
});

// Endpoint de Registrar Categoría
app.post('/api/categorias', async (req, res) => {
  const { nombre, emoji, cobra_envase } = req.body;
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({
      success: false,
      message: 'El nombre de la categoría es obligatorio.'
    });
  }
  try {
    const exist = await pool.query('SELECT id FROM categorias WHERE nombre = $1', [nombre.trim()]);
    if (exist.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'La categoría ya existe.'
      });
    }
    const maxRes = await pool.query('SELECT COALESCE(MAX(orden), 0) as max_order FROM categorias');
    const nextOrder = parseInt(maxRes.rows[0].max_order, 10) + 1;
    const result = await pool.query(
      'INSERT INTO categorias (nombre, emoji, orden, cobra_envase) VALUES ($1, $2, $3, $4) RETURNING id, nombre, emoji, orden, cobra_envase',
      [nombre.trim(), emoji ? emoji.trim() : '🏷️', nextOrder, cobra_envase !== false]
    );
    res.status(201).json({
      success: true,
      message: `Categoría "${nombre.trim()}" creada con éxito.`,
      categoria: result.rows[0]
    });
  } catch (err) {
    console.error('Error en POST /api/categorias:', err.message);
    res.status(500).json({
      success: false,
      message: 'Error al registrar la categoría en la base de datos.'
    });
  }
});

// Endpoint de Editar Categoría
app.put('/api/categorias/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, emoji, cobra_envase } = req.body;
  if (!nombre || !nombre.trim()) {
    return res.status(400).json({
      success: false,
      message: 'El nombre de la categoría es obligatorio.'
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Obtener nombre actual
    const catRes = await client.query('SELECT nombre FROM categorias WHERE id = $1', [id]);
    if (catRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'La categoría no existe.'
      });
    }
    const catNombreAntiguo = catRes.rows[0].nombre;
    const catNombreNuevo = nombre.trim();

    // Verificar duplicados si el nombre cambia
    if (catNombreAntiguo !== catNombreNuevo) {
      const dupRes = await client.query('SELECT id FROM categorias WHERE nombre = $1', [catNombreNuevo]);
      if (dupRes.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Ya existe otra categoría con este nombre.'
        });
      }
    }

    // Actualizar productos asociados
    await client.query('UPDATE productos SET categoria = $1 WHERE categoria = $2', [catNombreNuevo, catNombreAntiguo]);

    // Actualizar la categoría
    await client.query('UPDATE categorias SET nombre = $1, emoji = $2, cobra_envase = $3 WHERE id = $4', [catNombreNuevo, emoji ? emoji.trim() : '🏷️', cobra_envase !== false, id]);

    await client.query('COMMIT');
    res.json({
      success: true,
      message: `Categoría actualizada a "${catNombreNuevo}" con éxito.`
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en PUT /api/categorias:', err.message);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar la categoría.'
    });
  } finally {
    client.release();
  }
});

// Endpoint de Eliminar Categoría
app.delete('/api/categorias/:id', async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Obtener el nombre de la categoría antes de borrarla
    const catRes = await client.query('SELECT nombre FROM categorias WHERE id = $1', [id]);
    if (catRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'La categoría no existe.'
      });
    }
    const catNombre = catRes.rows[0].nombre;

    // Actualizar productos asociados para que usen 'Otros'
    await client.query("UPDATE productos SET categoria = 'Otros' WHERE categoria = $1", [catNombre]);

    // Eliminar la categoría
    await client.query('DELETE FROM categorias WHERE id = $1', [id]);

    await client.query('COMMIT');
    res.json({
      success: true,
      message: `Categoría "${catNombre}" eliminada correctamente.`
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en DELETE /api/categorias:', err.message);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la categoría.'
    });
  } finally {
    client.release();
  }
});

// Endpoint de Reordenar Categorías
app.post('/api/categorias/reordenar', async (req, res) => {
  const { ordenamiento } = req.body;
  if (!Array.isArray(ordenamiento)) {
    return res.status(400).json({
      success: false,
      message: 'El formato de ordenamiento es inválido.'
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (let i = 0; i < ordenamiento.length; i++) {
      const catId = ordenamiento[i];
      await client.query('UPDATE categorias SET orden = $1 WHERE id = $2', [i, catId]);
    }
    await client.query('COMMIT');
    res.json({
      success: true,
      message: 'Orden de categorías actualizado correctamente.'
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en POST /api/categorias/reordenar:', err.message);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el orden de las categorías.'
    });
  } finally {
    client.release();
  }
});

// Endpoint de Registrar Pedido
app.post('/api/pedidos', async (req, res) => {
  const { 
    cliente_nombre, 
    total, 
    atendido_por, 
    productos, 
    nota, 
    tipo_entrega, 
    tipo_transaccion,
    monto_efectivo,
    monto_debito,
    monto_credito,
    pago_mixto_detalle,
    cantidad_envases,
    monto_envases,
    turno_id
  } = req.body;

  if (!total || !atendido_por || !productos || !Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Datos del pedido incompletos o inválidos.'
    });
  }

  const numTotal = parseFloat(total) || 0;
  let finalEfec = 0;
  let finalDeb = 0;
  let finalCred = 0;
  const transTipo = tipo_transaccion || 'Efectivo';

  if (transTipo === 'Mixto') {
    finalEfec = parseFloat(monto_efectivo) || 0;
    finalDeb = parseFloat(monto_debito) || 0;
    finalCred = parseFloat(monto_credito) || 0;
  } else if (transTipo === 'Débito') {
    finalDeb = numTotal;
  } else if (transTipo === 'Crédito') {
    finalCred = numTotal;
  } else {
    finalEfec = numTotal;
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Resolver el turno activo
    let finalTurnoId = parseInt(turno_id) || null;
    if (!finalTurnoId) {
      const activeShiftRes = await client.query('SELECT id FROM turnos WHERE activo = TRUE LIMIT 1');
      if (activeShiftRes.rows.length > 0) {
        finalTurnoId = activeShiftRes.rows[0].id;
      }
    }

    // 1. Insertar la cabecera del pedido
    const orderRes = await client.query(
      'INSERT INTO pedidos (cliente_nombre, total, atendido_por, nota, tipo_entrega, tipo_transaccion, monto_efectivo, monto_debito, monto_credito, pago_mixto_detalle, cantidad_envases, monto_envases, turno_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id, fecha_hora',
      [
        cliente_nombre ? cliente_nombre.trim() : null, 
        total, 
        atendido_por.trim(), 
        nota ? nota.trim() : null, 
        tipo_entrega || 'Servir', 
        transTipo, 
        finalEfec, 
        finalDeb, 
        finalCred, 
        pago_mixto_detalle ? String(pago_mixto_detalle).trim() : null,
        parseInt(cantidad_envases) || 0,
        parseFloat(monto_envases) || 0,
        finalTurnoId
      ]
    );
    const pedidoId = orderRes.rows[0].id;
    const fechaHora = orderRes.rows[0].fecha_hora;

    // 2. Insertar cada producto y descontar ingredientes del inventario
    for (const item of productos) {
      // Validar si el ID es numérico (entero válido) o si proviene de una promoción (ej: 'promo-1-1784864199234')
      const rawId = item.id;
      const isIntegerId = (typeof rawId === 'number' && Number.isInteger(rawId)) ||
                        (typeof rawId === 'string' && /^\d+$/.test(rawId));
      const validProductId = isIntegerId ? parseInt(rawId, 10) : null;
      const isPromo = !!(item.promocion_id || (typeof rawId === 'string' && rawId.startsWith('promo-')));
      const promoIdVal = item.promocion_id ? parseInt(item.promocion_id, 10) : (typeof rawId === 'string' && rawId.startsWith('promo-') ? parseInt(rawId.split('-')[1], 10) : null);

      let prodsIncluidos = null;
      if (isPromo) {
        prodsIncluidos = [];
        let fijos = item.productos_fijos;
        if ((!fijos || !Array.isArray(fijos) || fijos.length === 0) && promoIdVal) {
          const fijosRes = await client.query(
            'SELECT pf.producto_id, pf.cantidad, p.nombre as nombre_producto FROM promocion_productos_fijos pf JOIN productos p ON pf.producto_id = p.id WHERE pf.promocion_id = $1',
            [promoIdVal]
          );
          fijos = fijosRes.rows;
        }
        if (fijos && Array.isArray(fijos)) {
          for (const prodFijo of fijos) {
            let nom = prodFijo.nombre_producto || prodFijo.nombre;
            if (!nom && prodFijo.producto_id) {
              const pRes = await client.query('SELECT nombre FROM productos WHERE id = $1', [prodFijo.producto_id]);
              if (pRes.rows.length > 0) nom = pRes.rows[0].nombre;
            }
            if (nom) {
              const cFija = (parseInt(prodFijo.cantidad) || 1) * item.cantidad;
              prodsIncluidos.push({ producto_id: prodFijo.producto_id, nombre_producto: nom, cantidad: cFija });
            }
          }
        }
        if (item.opciones_elegidas && Array.isArray(item.opciones_elegidas)) {
          for (const opcion of item.opciones_elegidas) {
            let nom = opcion.nombre_producto;
            if (!nom && opcion.producto_id) {
              const pRes = await client.query('SELECT nombre FROM productos WHERE id = $1', [opcion.producto_id]);
              if (pRes.rows.length > 0) nom = pRes.rows[0].nombre;
            }
            if (nom) {
              prodsIncluidos.push({ producto_id: opcion.producto_id, nombre_producto: nom, cantidad: item.cantidad });
            }
          }
        }
      }

      // Registrar el producto en el detalle del pedido
      await client.query(
        'INSERT INTO pedido_productos (pedido_id, producto_id, nombre_producto, cantidad, precio_unitario, promocion_id, productos_incluidos) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [pedidoId, validProductId, item.nombre, item.cantidad, item.precio, promoIdVal, prodsIncluidos ? JSON.stringify(prodsIncluidos) : null]
      );

      if (isPromo) {
        // 1. Descontar ingredientes de Productos Fijos de la promoción
        let fijos = item.productos_fijos;
        if (!fijos || !Array.isArray(fijos) || fijos.length === 0) {
          if (item.promocion_id) {
            const fijosRes = await client.query(
              'SELECT producto_id, cantidad FROM promocion_productos_fijos WHERE promocion_id = $1',
              [item.promocion_id]
            );
            fijos = fijosRes.rows;
          }
        }

        if (fijos && Array.isArray(fijos)) {
          for (const prodFijo of fijos) {
            if (prodFijo.producto_id) {
              const recipeRes = await client.query(
                'SELECT ingrediente_id, cantidad FROM producto_ingredientes WHERE producto_id = $1',
                [prodFijo.producto_id]
              );
              for (const recipeItem of recipeRes.rows) {
                const discountAmount = parseFloat(recipeItem.cantidad) * (parseInt(prodFijo.cantidad) || 1) * item.cantidad;
                await client.query(
                  'UPDATE ingredientes SET stock = GREATEST(0, stock - $1) WHERE id = $2',
                  [discountAmount, recipeItem.ingrediente_id]
                );
              }
            }
          }
        }

        // 2. Descontar ingredientes de Opciones Elegidas en los pasos de la promoción
        if (item.opciones_elegidas && Array.isArray(item.opciones_elegidas)) {
          for (const opcion of item.opciones_elegidas) {
            if (opcion.producto_id) {
              const recipeRes = await client.query(
                'SELECT ingrediente_id, cantidad FROM producto_ingredientes WHERE producto_id = $1',
                [opcion.producto_id]
              );
              for (const recipeItem of recipeRes.rows) {
                const discountAmount = parseFloat(recipeItem.cantidad) * item.cantidad;
                await client.query(
                  'UPDATE ingredientes SET stock = GREATEST(0, stock - $1) WHERE id = $2',
                  [discountAmount, recipeItem.ingrediente_id]
                );
              }
            }
          }
        }
      } else if (validProductId) {
        // Es un producto normal, descontar ingredientes del producto base
        const recipeRes = await client.query(
          'SELECT ingrediente_id, cantidad FROM producto_ingredientes WHERE producto_id = $1',
          [validProductId]
        );
        for (const recipeItem of recipeRes.rows) {
          const discountAmount = parseFloat(recipeItem.cantidad) * item.cantidad;
          await client.query(
            'UPDATE ingredientes SET stock = GREATEST(0, stock - $1) WHERE id = $2',
            [discountAmount, recipeItem.ingrediente_id]
          );
        }
      }
    }

    await client.query('COMMIT');
    res.json({
      success: true,
      message: 'Pedido registrado con éxito.',
      ticket: pedidoId,
      fecha_hora: fechaHora
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en POST /api/pedidos:', err.message);
    res.status(500).json({
      success: false,
      message: 'Error al procesar el registro del pedido.'
    });
  } finally {
    client.release();
  }
});

// Endpoint de Historial de Pedidos
app.get('/api/pedidos', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.cliente_nombre, p.total, p.fecha_hora, p.atendido_por, p.nota, p.tipo_entrega, p.tipo_transaccion,
             p.monto_efectivo, p.monto_debito, p.monto_credito, p.pago_mixto_detalle, p.cantidad_envases, p.monto_envases, p.turno_id,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', dp.id,
                   'producto_id', dp.producto_id,
                   'nombre_producto', dp.nombre_producto,
                   'cantidad', dp.cantidad,
                   'precio_unitario', dp.precio_unitario,
                   'promocion_id', dp.promocion_id,
                   'productos_incluidos', dp.productos_incluidos
                 )
               ) FILTER (WHERE dp.id IS NOT NULL),
               '[]'
             ) as productos
      FROM pedidos p
      LEFT JOIN pedido_productos dp ON p.id = dp.pedido_id
      WHERE (p.eliminado IS FALSE OR p.eliminado IS NULL)
      GROUP BY p.id
      ORDER BY p.fecha_hora DESC
    `);
    res.json({
      success: true,
      pedidos: result.rows
    });
  } catch (err) {
    console.error('Error en GET /api/pedidos:', err.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el historial de pedidos.'
    });
  }
});

// Endpoint de Historial de Pedidos Eliminados
app.get('/api/pedidos/eliminados', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.cliente_nombre, p.total, p.fecha_hora, p.atendido_por, p.nota, p.tipo_entrega, p.tipo_transaccion,
             p.monto_efectivo, p.monto_debito, p.monto_credito, p.pago_mixto_detalle, p.cantidad_envases, p.monto_envases, p.turno_id,
             p.eliminado_por, p.eliminado_fecha,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', dp.id,
                   'producto_id', dp.producto_id,
                   'nombre_producto', dp.nombre_producto,
                   'cantidad', dp.cantidad,
                   'precio_unitario', dp.precio_unitario,
                   'promocion_id', dp.promocion_id,
                   'productos_incluidos', dp.productos_incluidos
                 )
               ) FILTER (WHERE dp.id IS NOT NULL),
               '[]'
             ) as productos
      FROM pedidos p
      LEFT JOIN pedido_productos dp ON p.id = dp.pedido_id
      WHERE p.eliminado IS TRUE
      GROUP BY p.id
      ORDER BY p.eliminado_fecha DESC
    `);
    res.json({
      success: true,
      pedidos: result.rows
    });
  } catch (err) {
    console.error('Error en GET /api/pedidos/eliminados:', err.message);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el historial de pedidos eliminados.'
    });
  }
});

// Endpoint para eliminar comanda (Soft-delete con verificación de contraseña de Administrador)
app.delete('/api/pedidos/:id', async (req, res) => {
  const { id } = req.params;
  const { contrasena, admin_nombre } = req.body || {};

  if (!contrasena) {
    return res.status(400).json({
      success: false,
      message: 'Se requiere ingresar la contraseña de Administrador.'
    });
  }

  const client = await pool.connect();
  try {
    // 1. Validar la contraseña de Administrador
    let adminRes;
    if (admin_nombre) {
      adminRes = await client.query(
        "SELECT id, nombre, contrasena, cargo FROM usuarios WHERE LOWER(nombre) = LOWER($1) AND LOWER(cargo) = 'administrador'",
        [admin_nombre.trim()]
      );
    }
    
    if (!adminRes || adminRes.rows.length === 0) {
      adminRes = await client.query(
        "SELECT id, nombre, contrasena, cargo FROM usuarios WHERE LOWER(cargo) = 'administrador' AND contrasena = $1 LIMIT 1",
        [contrasena.trim()]
      );
    }

    if (adminRes.rows.length === 0 || adminRes.rows[0].contrasena !== contrasena.trim()) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña de administrador incorrecta.'
      });
    }

    const adminUser = adminRes.rows[0];

    // 2. Verificar existencia del pedido
    const orderRes = await client.query(
      'SELECT id, cliente_nombre, total, (eliminado IS TRUE) as esta_eliminado FROM pedidos WHERE id = $1',
      [id]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'La comanda especificada no existe.' });
    }

    if (orderRes.rows[0].esta_eliminado) {
      return res.status(400).json({ success: false, message: 'La comanda ya ha sido eliminada previamente.' });
    }

    await client.query('BEGIN');

    // 3. Revertir el descuento de ingredientes en el inventario
    const itemsRes = await client.query(
      'SELECT producto_id, cantidad, promocion_id, productos_incluidos FROM pedido_productos WHERE pedido_id = $1',
      [id]
    );

    for (const item of itemsRes.rows) {
      const isPromo = !!(item.promocion_id || item.productos_incluidos);
      const cantItem = parseInt(item.cantidad) || 1;

      if (isPromo) {
        let incluidos = item.productos_incluidos;
        if (typeof incluidos === 'string') {
          try { incluidos = JSON.parse(incluidos); } catch(e) { incluidos = null; }
        }

        if (Array.isArray(incluidos) && incluidos.length > 0) {
          for (const inc of incluidos) {
            if (inc.producto_id) {
              const recipeRes = await client.query(
                'SELECT ingrediente_id, cantidad FROM producto_ingredientes WHERE producto_id = $1',
                [inc.producto_id]
              );
              for (const recipeItem of recipeRes.rows) {
                const restoreAmount = parseFloat(recipeItem.cantidad) * (parseInt(inc.cantidad) || 1);
                await client.query(
                  'UPDATE ingredientes SET stock = stock + $1 WHERE id = $2',
                  [restoreAmount, recipeItem.ingrediente_id]
                );
              }
            }
          }
        }
      } else if (item.producto_id) {
        const recipeRes = await client.query(
          'SELECT ingrediente_id, cantidad FROM producto_ingredientes WHERE producto_id = $1',
          [item.producto_id]
        );
        for (const recipeItem of recipeRes.rows) {
          const restoreAmount = parseFloat(recipeItem.cantidad) * cantItem;
          await client.query(
            'UPDATE ingredientes SET stock = stock + $1 WHERE id = $2',
            [restoreAmount, recipeItem.ingrediente_id]
          );
        }
      }
    }

    // 4. Marcar la comanda como eliminada (Soft-delete)
    await client.query(
      'UPDATE pedidos SET eliminado = TRUE, eliminado_por = $1, eliminado_fecha = CURRENT_TIMESTAMP WHERE id = $2',
      [adminUser.nombre, id]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `Comanda Ticket #${id} del cliente "${orderRes.rows[0].cliente_nombre || 'Sin Nombre'}" eliminada correctamente.`
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en DELETE /api/pedidos/:id:', err.message);
    res.status(500).json({ success: false, message: 'Error interno al eliminar la comanda.' });
  } finally {
    client.release();
  }
});

// Endpoint de Cierre de Caja del Día
app.get('/api/informes/cierre', async (req, res) => {
  const { fecha, turno_id } = req.query; // YYYY-MM-DD, and optional turno_id
  if (!fecha) {
    return res.status(400).json({ success: false, message: 'La fecha es requerida.' });
  }

  const useShift = (turno_id && turno_id !== 'all' && turno_id !== 'todos' && turno_id !== 'undefined');
  const filterVal = useShift ? parseInt(turno_id, 10) : fecha;
  const whereClause = useShift ? 'turno_id = $1' : 'DATE(fecha_hora) = $1';
  const whereClauseP = useShift ? 'p.turno_id = $1' : 'DATE(p.fecha_hora) = $1';

  try {
    const result = await pool.query(`
      SELECT 
        COALESCE(SUM(total), 0)::FLOAT as total_ventas,
        MIN(id) as ticket_inicio,
        MAX(id) as ticket_fin,
        COALESCE(SUM(CASE WHEN tipo_transaccion = 'Efectivo' THEN total WHEN tipo_transaccion = 'Mixto' THEN COALESCE(monto_efectivo, 0) ELSE 0 END), 0)::FLOAT as total_efectivo,
        COALESCE(SUM(CASE WHEN tipo_transaccion = 'Débito' THEN total WHEN tipo_transaccion = 'Mixto' THEN COALESCE(monto_debito, 0) ELSE 0 END), 0)::FLOAT as total_debito,
        COALESCE(SUM(CASE WHEN tipo_transaccion = 'Crédito' THEN total WHEN tipo_transaccion = 'Mixto' THEN COALESCE(monto_credito, 0) ELSE 0 END), 0)::FLOAT as total_credito
      FROM pedidos
      WHERE ${whereClause} AND (eliminado IS FALSE OR eliminado IS NULL)
    `, [filterVal]);

    const row = result.rows[0];
    const total_ventas = row.total_ventas;
    const ticket_inicio = row.ticket_inicio;
    const ticket_fin = row.ticket_fin;
    const total_efectivo = row.total_efectivo;
    const total_debito = row.total_debito;
    const total_credito = row.total_credito;
    const total_tarjeta = total_debito + total_credito;

    // Consultar el desglose de productos vendidos en el día (excluyendo comandas eliminadas)
    const productosResult = await pool.query(`
      SELECT 
        pp.nombre_producto,
        SUM(pp.cantidad)::INTEGER as cantidad_vendida,
        SUM(pp.cantidad * pp.precio_unitario)::INTEGER as total_pesos
      FROM pedidos p
      JOIN pedido_productos pp ON p.id = pp.pedido_id
      WHERE ${whereClauseP} AND (p.eliminado IS FALSE OR p.eliminado IS NULL)
      GROUP BY pp.nombre_producto
      ORDER BY cantidad_vendida DESC
    `, [filterVal]);

    // Consultar total de envases vendidos en el día (excluyendo comandas eliminadas)
    const envasesResult = await pool.query(`
      SELECT 
        COALESCE(SUM(cantidad_envases), 0)::INTEGER as cantidad,
        COALESCE(SUM(monto_envases), 0)::INTEGER as total_pesos
      FROM pedidos
      WHERE ${whereClause} AND (eliminado IS FALSE OR eliminado IS NULL)
    `, [filterVal]);

    const envases_vendidos = envasesResult.rows[0] || { cantidad: 0, total_pesos: 0 };

    // Consultar desglose de productos individuales incluidos en promociones vendidas en el día (excluyendo eliminadas)
    const promoProdsQuery = await pool.query(`
      SELECT 
        pp.promocion_id,
        pp.nombre_producto as promo_nombre,
        pp.cantidad as promo_cantidad,
        pp.productos_incluidos
      FROM pedidos p
      JOIN pedido_productos pp ON p.id = pp.pedido_id
      WHERE ${whereClauseP}
        AND (p.eliminado IS FALSE OR p.eliminado IS NULL)
        AND (
          pp.promocion_id IS NOT NULL 
          OR pp.productos_incluidos IS NOT NULL 
          OR pp.nombre_producto IN (SELECT nombre FROM promociones)
        )
    `, [filterVal]);

    const mapaProdsPromo = {};

    for (const row of promoProdsQuery.rows) {
      let incluidos = row.productos_incluidos;
      if (typeof incluidos === 'string') {
        try { incluidos = JSON.parse(incluidos); } catch(e) { incluidos = null; }
      }

      if (Array.isArray(incluidos) && incluidos.length > 0) {
        const promoQty = parseInt(row.promo_cantidad) || 1;
        for (const item of incluidos) {
          const nom = item.nombre_producto;
          const cant = parseInt(item.cantidad) || 1;
          if (nom) {
            mapaProdsPromo[nom] = (mapaProdsPromo[nom] || 0) + cant;
          }
        }
      } else {
        const promoId = row.promocion_id;
        const promoNombre = row.promo_nombre;
        const qty = parseInt(row.promo_cantidad) || 1;

        const promoRes = await pool.query(
          'SELECT id FROM promociones WHERE id = $1 OR nombre = $2 LIMIT 1',
          [promoId || 0, promoNombre]
        );

        if (promoRes.rows.length > 0) {
          const pid = promoRes.rows[0].id;
          const fijosRes = await pool.query(
            'SELECT p.nombre, pf.cantidad FROM promocion_productos_fijos pf JOIN productos p ON pf.producto_id = p.id WHERE pf.promocion_id = $1',
            [pid]
          );
          for (const f of fijosRes.rows) {
            const nom = f.nombre;
            const cant = (parseInt(f.cantidad) || 1) * qty;
            mapaProdsPromo[nom] = (mapaProdsPromo[nom] || 0) + cant;
          }

          const pasosRes = await pool.query(
            'SELECT pa.id FROM promocion_pasos pa WHERE pa.promocion_id = $1',
            [pid]
          );
          for (const paso of pasosRes.rows) {
            const opcRes = await pool.query(
              'SELECT p.nombre FROM promocion_opciones op JOIN productos p ON op.producto_id = p.id WHERE op.promocion_paso_id = $1 LIMIT 1',
              [paso.id]
            );
            if (opcRes.rows.length > 0) {
              const nom = opcRes.rows[0].nombre;
              mapaProdsPromo[nom] = (mapaProdsPromo[nom] || 0) + qty;
            }
          }
        }
      }
    }

    const productos_promociones = Object.keys(mapaProdsPromo).map(nom => ({
      nombre_producto: nom,
      cantidad_total: mapaProdsPromo[nom]
    })).sort((a, b) => b.cantidad_total - a.cantidad_total);

    // Obtener la lista de nombres de todas las promociones para distinguirlas de productos normales
    const promosListRes = await pool.query('SELECT nombre FROM promociones');
    const promosNombresSet = new Set(promosListRes.rows.map(r => r.nombre));

    const mapaUnificados = {};

    // 1. Sumar productos individuales vendidos directamente
    for (const p of productosResult.rows) {
      const nom = p.nombre_producto;
      const cant = parseInt(p.cantidad_vendida) || 0;
      if (!promosNombresSet.has(nom)) {
        if (!mapaUnificados[nom]) {
          mapaUnificados[nom] = { nombre_producto: nom, cantidad_directa: 0, cantidad_promo: 0, cantidad_total: 0 };
        }
        mapaUnificados[nom].cantidad_directa += cant;
        mapaUnificados[nom].cantidad_total += cant;
      }
    }

    // 2. Sumar productos provenientes de promociones
    for (const p of productos_promociones) {
      const nom = p.nombre_producto;
      const cant = parseInt(p.cantidad_total) || 0;
      if (!mapaUnificados[nom]) {
        mapaUnificados[nom] = { nombre_producto: nom, cantidad_directa: 0, cantidad_promo: 0, cantidad_total: 0 };
      }
      mapaUnificados[nom].cantidad_promo += cant;
      mapaUnificados[nom].cantidad_total += cant;
    }

    // 3. Incluir envases para llevar si existen
    if (envases_vendidos && envases_vendidos.cantidad > 0) {
      mapaUnificados['Envases para llevar'] = {
        nombre_producto: 'Envases para llevar',
        cantidad_directa: envases_vendidos.cantidad,
        cantidad_promo: 0,
        cantidad_total: envases_vendidos.cantidad
      };
    }

    const productos_unificados = Object.values(mapaUnificados)
      .sort((a, b) => b.cantidad_total - a.cantidad_total);

    // Consultar el gasto real de ingredientes (materia prima) basado en la totalidad de productos vendidos
    const mapaIngredientesGastados = {};

    for (const prod of productos_unificados) {
      const cantTotal = parseInt(prod.cantidad_total) || 0;
      if (cantTotal <= 0) continue;

      const recipeRes = await pool.query(`
        SELECT 
          i.id as ingrediente_id,
          i.nombre as ingrediente_nombre,
          pi.cantidad as cantidad_por_unidad
        FROM productos pr
        JOIN producto_ingredientes pi ON pr.id = pi.producto_id
        JOIN ingredientes i ON pi.ingrediente_id = i.id
        WHERE pr.nombre = $1
      `, [prod.nombre_producto]);

      for (const ing of recipeRes.rows) {
        const ingId = ing.ingrediente_id;
        const ingNombre = ing.ingrediente_nombre;
        const gastado = parseFloat(ing.cantidad_por_unidad) * cantTotal;

        if (!mapaIngredientesGastados[ingId]) {
          mapaIngredientesGastados[ingId] = {
            ingrediente_nombre: ingNombre,
            cantidad_gastada: 0
          };
        }
        mapaIngredientesGastados[ingId].cantidad_gastada += gastado;
      }
    }

    const ingredientes_gastados = Object.values(mapaIngredientesGastados)
      .sort((a, b) => b.cantidad_gastada - a.cantidad_gastada);

    // Consultar comandas eliminadas en la fecha seleccionada
    const eliminadasResult = await pool.query(`
      SELECT 
        id, 
        cliente_nombre, 
        total::FLOAT, 
        COALESCE(eliminado_por, 'Administrador') as eliminado_por, 
        TO_CHAR(eliminado_fecha, 'HH24:MI') as hora_eliminado
      FROM pedidos
      WHERE ${whereClause} AND eliminado = TRUE
      ORDER BY eliminado_fecha DESC
    `, [filterVal]);

    const comandas_eliminadas = eliminadasResult.rows;
    const cantidad_eliminadas = comandas_eliminadas.length;
    const monto_total_eliminado = comandas_eliminadas.reduce((acc, curr) => acc + (curr.total || 0), 0);

    // Consultar el efectivo inicial sugerido del o los turnos
    let efectivoInicialSugerido = 50000;
    if (useShift) {
      const shiftRes = await pool.query('SELECT COALESCE(efectivo_inicial, 0)::FLOAT as efectivo_inicial FROM turnos WHERE id = $1', [filterVal]);
      if (shiftRes.rows.length > 0) {
        efectivoInicialSugerido = shiftRes.rows[0].efectivo_inicial;
      }
    } else {
      const shiftRes = await pool.query('SELECT COALESCE(SUM(efectivo_inicial), 0)::FLOAT as efectivo_inicial FROM turnos WHERE DATE(fecha_hora_inicio) = $1', [filterVal]);
      if (shiftRes.rows.length > 0 && shiftRes.rows[0].efectivo_inicial > 0) {
        efectivoInicialSugerido = shiftRes.rows[0].efectivo_inicial;
      }
    }

    res.json({
      success: true,
      data: {
        fecha,
        total_ventas,
        ticket_inicio,
        ticket_fin,
        total_efectivo,
        total_debito,
        total_credito,
        total_tarjeta,
        productos_vendidos: productosResult.rows,
        envases_vendidos,
        productos_promociones,
        productos_unificados,
        ingredientes_gastados,
        comandas_eliminadas,
        cantidad_eliminadas,
        monto_total_eliminado,
        efectivo_inicial_sugerido: efectivoInicialSugerido
      }
    });
  } catch (err) {
    console.error('Error en GET /api/informes/cierre:', err.message);
    res.status(500).json({ success: false, message: 'Error al obtener el informe de cierre.' });
  }
});

// Endpoint para consultar el cuadrado de caja de una fecha específica
app.get('/api/cierres/:fecha', async (req, res) => {
  const { fecha } = req.params; // YYYY-MM-DD
  if (!fecha) {
    return res.status(400).json({ success: false, message: 'La fecha es requerida.' });
  }

  try {
    const result = await pool.query(
      `SELECT 
        id, 
        TO_CHAR(fecha, 'YYYY-MM-DD') as fecha, 
        cierre_fecha_hora, 
        cargado_por, 
        total_ventas::FLOAT, 
        total_efectivo::FLOAT, 
        total_tarjeta::FLOAT, 
        fondo_apertura::FLOAT, 
        efectivo_real::FLOAT, 
        diferencia::FLOAT, 
        observaciones 
      FROM cierres_caja 
      WHERE fecha = $1`,
      [fecha]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, exists: false, data: null });
    }

    res.json({
      success: true,
      exists: true,
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error en GET /api/cierres/:fecha:', err.message);
    res.status(500).json({ success: false, message: 'Error al obtener el cierre de caja de la base de datos.' });
  }
});

// Endpoint para guardar o actualizar (UPSERT) el cuadrado de caja
app.post('/api/cierres', async (req, res) => {
  const {
    fecha,
    cargado_por,
    total_ventas,
    total_efectivo,
    total_tarjeta,
    fondo_apertura,
    efectivo_real,
    observaciones
  } = req.body;

  if (
    !fecha || 
    !cargado_por || 
    total_ventas === undefined || 
    total_efectivo === undefined || 
    total_tarjeta === undefined || 
    fondo_apertura === undefined || 
    efectivo_real === undefined
  ) {
    return res.status(400).json({ success: false, message: 'Datos incompletos para registrar el cierre de caja.' });
  }

  const fApertura = parseFloat(fondo_apertura);
  const eReal = parseFloat(efectivo_real);
  const tEfectivo = parseFloat(total_efectivo);
  const tVentas = parseFloat(total_ventas);
  const tTarjeta = parseFloat(total_tarjeta);

  // Diferencia = Efectivo Real - (Efectivo Ventas + Fondo Apertura)
  const dif = eReal - (tEfectivo + fApertura);

  try {
    const queryStr = `
      INSERT INTO cierres_caja (
        fecha, cargado_por, total_ventas, total_efectivo, total_tarjeta, fondo_apertura, efectivo_real, diferencia, observaciones
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (fecha)
      DO UPDATE SET
        cierre_fecha_hora = CURRENT_TIMESTAMP,
        cargado_por = EXCLUDED.cargado_por,
        total_ventas = EXCLUDED.total_ventas,
        total_efectivo = EXCLUDED.total_efectivo,
        total_tarjeta = EXCLUDED.total_tarjeta,
        fondo_apertura = EXCLUDED.fondo_apertura,
        efectivo_real = EXCLUDED.efectivo_real,
        diferencia = EXCLUDED.diferencia,
        observaciones = EXCLUDED.observaciones
      RETURNING 
        id, 
        TO_CHAR(fecha, 'YYYY-MM-DD') as fecha, 
        cierre_fecha_hora, 
        cargado_por, 
        total_ventas::FLOAT, 
        total_efectivo::FLOAT, 
        total_tarjeta::FLOAT, 
        fondo_apertura::FLOAT, 
        efectivo_real::FLOAT, 
        diferencia::FLOAT, 
        observaciones;
    `;

    const result = await pool.query(queryStr, [
      fecha,
      cargado_por,
      tVentas,
      tEfectivo,
      tTarjeta,
      fApertura,
      eReal,
      dif,
      observaciones || ''
    ]);

    res.json({
      success: true,
      message: 'Cuadrado de caja registrado con éxito.',
      data: result.rows[0]
    });
  } catch (err) {
    console.error('Error en POST /api/cierres:', err.message);
    res.status(500).json({ success: false, message: 'Error al registrar el cierre de caja en la base de datos.' });
  }
});

// Endpoint de Exportar Resumen Mensual a Excel
app.get('/api/informes/excel', async (req, res) => {
  const { mes } = req.query; // YYYY-MM
  if (!mes) {
    return res.status(400).json({ success: false, message: 'El mes (YYYY-MM) es requerido.' });
  }

  try {
    const result = await pool.query(`
      SELECT 
        TO_CHAR(fecha_hora, 'YYYY-MM-DD') as fecha,
        COALESCE(SUM(CASE WHEN tipo_transaccion = 'Efectivo' THEN total WHEN tipo_transaccion = 'Mixto' THEN COALESCE(monto_efectivo, 0) ELSE 0 END), 0)::FLOAT as total_efectivo,
        COALESCE(SUM(CASE WHEN tipo_transaccion IN ('Débito', 'Crédito') THEN total WHEN tipo_transaccion = 'Mixto' THEN (COALESCE(monto_debito, 0) + COALESCE(monto_credito, 0)) ELSE 0 END), 0)::FLOAT as total_tarjeta,
        COALESCE(SUM(total), 0)::FLOAT as total_ventas
      FROM pedidos
      WHERE TO_CHAR(fecha_hora, 'YYYY-MM') = $1 AND (eliminado IS FALSE OR eliminado IS NULL)
      GROUP BY TO_CHAR(fecha_hora, 'YYYY-MM-DD')
      ORDER BY TO_CHAR(fecha_hora, 'YYYY-MM-DD') ASC
    `, [mes]);

    // Crear filas del reporte
    const rows = result.rows.map(r => ({
      'Fecha': r.fecha,
      'Ventas Efectivo ($)': r.total_efectivo,
      'Ventas Tarjeta ($)': r.total_tarjeta,
      'Total Ventas ($)': r.total_ventas
    }));

    // Si no hay ventas, añadir una fila informativa
    if (rows.length === 0) {
      rows.push({
        'Fecha': 'Sin ventas en este mes',
        'Ventas Efectivo ($)': 0,
        'Ventas Tarjeta ($)': 0,
        'Total Ventas ($)': 0
      });
    }

    // Generar Workbook con xlsx
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Ventas ${mes}`);

    // Configurar el ancho de las columnas
    const max_width = [15, 20, 20, 20];
    ws['!cols'] = max_width.map(w => ({ wch: w }));

    // Escribir el buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Resumen-Ventas-${mes}.xlsx`);
    res.end(buf);

  } catch (err) {
    console.error('Error en GET /api/informes/excel:', err.message);
    res.status(500).json({ success: false, message: 'Error al generar el archivo Excel.' });
  }
});

// Endpoint de Exportar Reporte de Ventas por Rango de Fechas (Detallado por Producto)
app.get('/api/informes/rango-productos/excel', async (req, res) => {
  const { fecha_inicio, fecha_fin } = req.query;
  if (!fecha_inicio || !fecha_fin) {
    return res.status(400).json({ success: false, message: 'La fecha de inicio y la fecha de fin son requeridas.' });
  }

  try {
    const result = await pool.query(`
      SELECT 
        dp.nombre_producto as producto,
        SUM(dp.cantidad)::FLOAT as cantidad,
        SUM(dp.cantidad * dp.precio_unitario)::FLOAT as total
      FROM pedidos p
      JOIN pedido_productos dp ON p.id = dp.pedido_id
      WHERE DATE(p.fecha_hora) >= $1 AND DATE(p.fecha_hora) <= $2 AND (p.eliminado IS FALSE OR p.eliminado IS NULL)
      GROUP BY dp.nombre_producto
      ORDER BY cantidad DESC
    `, [fecha_inicio, fecha_fin]);

    const resultTotal = await pool.query(`
      SELECT COALESCE(SUM(total), 0)::FLOAT as total_ventas 
      FROM pedidos 
      WHERE DATE(fecha_hora) >= $1 AND DATE(fecha_hora) <= $2 AND (eliminado IS FALSE OR eliminado IS NULL)
    `, [fecha_inicio, fecha_fin]);
    const totalVentasReal = resultTotal.rows[0].total_ventas;

    // Crear filas del reporte
    const rows = result.rows.map(r => ({
      'Producto': r.producto,
      'Cantidad Vendida': r.cantidad,
      'Total Vendido ($)': r.total
    }));

    if (rows.length === 0) {
      rows.push({
        'Producto': 'Sin ventas en este rango de fechas',
        'Cantidad Vendida': 0,
        'Total Vendido ($)': 0
      });
    } else {
      // Calcular sumas totales
      const sumaCantidad = result.rows.reduce((sum, r) => sum + r.cantidad, 0);
      const sumaTotalProductos = result.rows.reduce((sum, r) => sum + r.total, 0);
      const diferencia = totalVentasReal - sumaTotalProductos;
      
      // Fila vacía para separación estética
      rows.push({
        'Producto': '',
        'Cantidad Vendida': '',
        'Total Vendido ($)': ''
      });

      if (Math.abs(diferencia) > 0) {
        rows.push({
          'Producto': 'Ajustes / Descuentos / Pedidos sin items',
          'Cantidad Vendida': '',
          'Total Vendido ($)': diferencia
        });
      }

      // Fila con los totales generales
      rows.push({
        'Producto': 'TOTAL GENERAL',
        'Cantidad Vendida': sumaCantidad,
        'Total Vendido ($)': totalVentasReal
      });
    }

    // Generar Workbook con xlsx
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas por Producto');

    // Configurar el ancho de las columnas
    const max_width = [35, 20, 20];
    ws['!cols'] = max_width.map(w => ({ wch: w }));

    // Escribir el buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Reporte-Ventas-Detallado-${fecha_inicio}-a-${fecha_fin}.xlsx`);
    res.end(buf);

  } catch (err) {
    console.error('Error en GET /api/informes/rango-productos/excel:', err.message);
    res.status(500).json({ success: false, message: 'Error al generar el archivo Excel.' });
  }
});

// Endpoint de Obtener Resumen Estadístico por Rango de Fechas (JSON)
app.get('/api/informes/rango-resumen', async (req, res) => {
  const { fecha_inicio, fecha_fin } = req.query;
  if (!fecha_inicio || !fecha_fin) {
    return res.status(400).json({ success: false, message: 'La fecha de inicio y la fecha de fin son requeridas.' });
  }

  try {
    const result = await pool.query(`
      SELECT 
        COALESCE(SUM(total), 0)::FLOAT as total_ventas,
        COUNT(id)::INTEGER as cantidad_pedidos,
        COALESCE(SUM(CASE WHEN tipo_transaccion = 'Efectivo' THEN total WHEN tipo_transaccion = 'Mixto' THEN COALESCE(monto_efectivo, 0) ELSE 0 END), 0)::FLOAT as total_efectivo,
        COALESCE(SUM(CASE WHEN tipo_transaccion = 'Débito' THEN total WHEN tipo_transaccion = 'Mixto' THEN COALESCE(monto_debito, 0) ELSE 0 END), 0)::FLOAT as total_debito,
        COALESCE(SUM(CASE WHEN tipo_transaccion = 'Crédito' THEN total WHEN tipo_transaccion = 'Mixto' THEN COALESCE(monto_credito, 0) ELSE 0 END), 0)::FLOAT as total_credito
      FROM pedidos
      WHERE DATE(fecha_hora) >= $1 AND DATE(fecha_hora) <= $2 AND (eliminado IS FALSE OR eliminado IS NULL)
    `, [fecha_inicio, fecha_fin]);

    const row = result.rows[0];
    const total_ventas = row.total_ventas || 0;
    const cantidad_pedidos = row.cantidad_pedidos || 0;
    const total_efectivo = row.total_efectivo || 0;
    const total_debito = row.total_debito || 0;
    const total_credito = row.total_credito || 0;
    const total_tarjeta = total_debito + total_credito;
    const ticket_promedio = cantidad_pedidos > 0 ? Math.round(total_ventas / cantidad_pedidos) : 0;

    res.json({
      success: true,
      data: {
        total_ventas,
        cantidad_pedidos,
        total_efectivo,
        total_debito,
        total_credito,
        total_tarjeta,
        ticket_promedio
      }
    });
  } catch (err) {
    console.error('Error en GET /api/informes/rango-resumen:', err.message);
    res.status(500).json({ success: false, message: 'Error al obtener el resumen por rango.' });
  }
});

// Endpoint para obtener ventas agrupadas por día (para gráficos)
app.get('/api/informes/rango-ventas-diarias', async (req, res) => {
  const { fecha_inicio, fecha_fin, agrupacion } = req.query;
  if (!fecha_inicio || !fecha_fin) {
    return res.status(400).json({ success: false, message: 'La fecha de inicio y la fecha de fin son requeridas.' });
  }

  try {
    let query, params;
    let groupExpr = `DATE(fecha_hora)`;
    let selectExpr = `TO_CHAR(DATE(fecha_hora), 'YYYY-MM-DD')`;

    if (agrupacion === 'mes') {
      groupExpr = `DATE_TRUNC('month', fecha_hora)`;
      selectExpr = `TO_CHAR(DATE_TRUNC('month', fecha_hora), 'YYYY-MM')`;
    } else if (agrupacion === 'semana') {
      groupExpr = `DATE_TRUNC('week', fecha_hora)`;
      selectExpr = `TO_CHAR(DATE_TRUNC('week', fecha_hora), 'YYYY-MM-DD')`;
    } else if (agrupacion === 'hora' || (fecha_inicio === fecha_fin && !agrupacion)) {
      groupExpr = `TO_CHAR(fecha_hora, 'HH24:00')`;
      selectExpr = `TO_CHAR(fecha_hora, 'HH24:00')`;
    }

    if (fecha_inicio === fecha_fin && selectExpr === `TO_CHAR(fecha_hora, 'HH24:00')`) {
      // Si es un solo día y se agrupa por hora
      query = `
        SELECT 
          ${selectExpr} as fecha,
          COALESCE(SUM(total), 0)::FLOAT as total_ventas,
          COUNT(id)::INTEGER as cantidad_pedidos
        FROM pedidos
        WHERE DATE(fecha_hora) = $1 AND (eliminado IS FALSE OR eliminado IS NULL)
        GROUP BY ${groupExpr}
        ORDER BY ${groupExpr} ASC
      `;
      params = [fecha_inicio];
    } else {
      // Para cualquier otro caso (rango de días)
      query = `
        SELECT 
          ${selectExpr} as fecha,
          COALESCE(SUM(total), 0)::FLOAT as total_ventas,
          COUNT(id)::INTEGER as cantidad_pedidos
        FROM pedidos
        WHERE DATE(fecha_hora) >= $1 AND DATE(fecha_hora) <= $2 AND (eliminado IS FALSE OR eliminado IS NULL)
        GROUP BY ${groupExpr}
        ORDER BY ${groupExpr} ASC
      `;
      params = [fecha_inicio, fecha_fin];
    }

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    console.error('Error en GET /api/informes/rango-ventas-diarias:', err.message);
    res.status(500).json({ success: false, message: 'Error al obtener ventas diarias.' });
  }
});

// Endpoint de Obtener Ventas de Productos por Rango (JSON para vista previa)
app.get('/api/informes/rango-productos-json', async (req, res) => {
  const { fecha_inicio, fecha_fin } = req.query;
  if (!fecha_inicio || !fecha_fin) {
    return res.status(400).json({ success: false, message: 'La fecha de inicio y la fecha de fin son requeridas.' });
  }

  try {
    const result = await pool.query(`
      SELECT 
        dp.nombre_producto as producto,
        SUM(dp.cantidad)::FLOAT as cantidad,
        SUM(dp.cantidad * dp.precio_unitario)::FLOAT as total
      FROM pedidos p
      JOIN pedido_productos dp ON p.id = dp.pedido_id
      WHERE DATE(p.fecha_hora) >= $1 AND DATE(p.fecha_hora) <= $2 AND (p.eliminado IS FALSE OR p.eliminado IS NULL)
      GROUP BY dp.nombre_producto
      ORDER BY cantidad DESC, total DESC
    `, [fecha_inicio, fecha_fin]);

    const resultTotal = await pool.query(`
      SELECT COALESCE(SUM(total), 0)::FLOAT as total_ventas 
      FROM pedidos 
      WHERE DATE(fecha_hora) >= $1 AND DATE(fecha_hora) <= $2 AND (eliminado IS FALSE OR eliminado IS NULL)
    `, [fecha_inicio, fecha_fin]);
    const totalVentasReal = resultTotal.rows[0].total_ventas;

    const sumaCantidad = result.rows.reduce((sum, r) => sum + r.cantidad, 0);
    const sumaTotalProductos = result.rows.reduce((sum, r) => sum + r.total, 0);
    const diferencia = totalVentasReal - sumaTotalProductos;

    const data = result.rows.map(r => ({
      producto: r.producto,
      cantidad: r.cantidad,
      total: r.total,
      porcentaje: totalVentasReal > 0 ? ((r.total / totalVentasReal) * 100).toFixed(1) : '0'
    }));

    if (Math.abs(diferencia) > 0) {
      data.push({
        producto: 'Ajustes / Descuentos',
        cantidad: 0,
        total: diferencia,
        porcentaje: totalVentasReal > 0 ? ((diferencia / totalVentasReal) * 100).toFixed(1) : '0'
      });
    }

    res.json({
      success: true,
      data,
      totales: {
        sumaCantidad,
        sumaTotal: totalVentasReal
      }
    });
  } catch (err) {
    console.error('Error en GET /api/informes/rango-productos-json:', err.message);
    res.status(500).json({ success: false, message: 'Error al obtener el detalle de productos.' });
  }
});

// Endpoint de Obtener Configuración
app.get('/api/configuracion', async (req, res) => {
  try {
    const result = await pool.query('SELECT clave, valor FROM configuracion');
    const configMap = {};
    result.rows.forEach(row => {
      configMap[row.clave] = row.valor;
    });
    res.json({ success: true, config: configMap });
  } catch (err) {
    console.error('Error en GET /api/configuracion:', err.message);
    res.status(500).json({ success: false, message: 'Error al obtener la configuración.' });
  }
});

// Endpoint de Guardar Configuración
app.post('/api/configuracion', async (req, res) => {
  const { config } = req.body;
  if (!config || typeof config !== 'object') {
    return res.status(400).json({ success: false, message: 'La configuración provista no es válida.' });
  }

  try {
    await pool.query('BEGIN');
    for (const [clave, valor] of Object.entries(config)) {
      await pool.query(`
        INSERT INTO configuracion (clave, valor)
        VALUES ($1, $2)
        ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor
      `, [clave, String(valor)]);
    }
    await pool.query('COMMIT');
    res.json({ success: true, message: 'Configuración guardada correctamente.' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error en POST /api/configuracion:', err.message);
    res.status(500).json({ success: false, message: 'Error al guardar la configuración.' });
  }
});

// Endpoint de Enviar Reporte de Inventario por Correo
app.post('/api/reportes/enviar', async (req, res) => {
  const { fork } = require('child_process');
  const path = require('path');
  try {
    const scriptPath = path.join(__dirname, 'comando_gmail.js');
    console.log(`[Backend] Ejecutando envío de correo de inventario usando fork: ${scriptPath}`);
    
    const child = fork(scriptPath, [], {
      env: { ...process.env }
    });
    
    let hasResponded = false;

    child.on('error', (err) => {
      console.error('[Backend] Error al ejecutar comando_gmail.js:', err);
      if (!hasResponded) {
        hasResponded = true;
        res.status(500).json({
          success: false,
          message: 'Error al ejecutar script de correo: ' + err.message
        });
      }
    });
    
    child.on('exit', (code) => {
      console.log(`[Backend] comando_gmail.js finalizado con código: ${code}`);
      if (!hasResponded) {
        hasResponded = true;
        if (code === 0) {
          res.json({
            success: true,
            message: 'Reporte de inventario enviado correctamente al correo.'
          });
        } else {
          res.status(500).json({
            success: false,
            message: 'Error al enviar correo de reporte. Verifique el correo destinatario/remitente y la configuración de contraseña SMTP.'
          });
        }
      }
    });
  } catch (err) {
    console.error('Error en POST /api/reportes/enviar:', err.message);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar el envío del reporte.'
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend escuchando en http://localhost:${PORT}`);
});
