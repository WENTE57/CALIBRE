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
    // 1. Asegurar columna categoria en productos
    await pool.query("ALTER TABLE productos ADD COLUMN IF NOT EXISTS categoria VARCHAR(100) DEFAULT 'Otros'");
    console.log("✅ Columna 'categoria' asegurada en la tabla productos.");

    // 2. Asegurar tabla categorias
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categorias (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(100) UNIQUE NOT NULL
      )
    `);
    console.log("✅ Tabla 'categorias' asegurada.");

    // 3. Asegurar tabla pedidos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pedidos (
        id SERIAL PRIMARY KEY,
        cliente_nombre VARCHAR(100) NOT NULL,
        total DECIMAL(10, 2) NOT NULL,
        fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atendido_por VARCHAR(100) NOT NULL
      )
    `);
    await pool.query("ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS nota TEXT");
    await pool.query("ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS tipo_entrega VARCHAR(50) DEFAULT 'Servir'");
    await pool.query("ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS tipo_transaccion VARCHAR(50) DEFAULT 'Efectivo'");
    console.log("✅ Tabla 'pedidos' asegurada (con columnas 'nota', 'tipo_entrega' y 'tipo_transaccion').");

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
    console.log("✅ Tabla 'pedido_productos' asegurada.");

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
  } catch (err) {
    console.error("❌ Error en la inicialización de la base de datos:", err.message);
  }
})();

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
        COALESCE(
          json_agg(
            json_build_object(
              'id', i.id,
              'nombre', i.nombre,
              'cantidad', pi.cantidad
            )
          ) FILTER (WHERE i.id IS NOT NULL), 
          '[]'
        ) AS ingredientes
      FROM productos p
      LEFT JOIN producto_ingredientes pi ON p.id = pi.producto_id
      LEFT JOIN ingredientes i ON pi.ingrediente_id = i.id
      WHERE p.activo = true
      GROUP BY p.id
      ORDER BY p.id ASC;
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
  const { nombre, precio, imagen, categoria, ingredientes } = req.body; // ingredientes: [{ ingrediente_id, cantidad }]

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
      'INSERT INTO productos (nombre, precio, imagen, categoria, activo) VALUES ($1, $2, $3, $4, true) RETURNING id, nombre',
      [nombre.trim(), parseFloat(precio), imagen ? imagen.trim() : '🍔', categoria ? categoria.trim() : 'Otros']
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
  const { nombre, precio, imagen, categoria, ingredientes } = req.body;

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
      'UPDATE productos SET nombre = $1, precio = $2, imagen = $3, categoria = $4 WHERE id = $5',
      [nombreNuevo, parseFloat(precio), imagen ? imagen.trim() : '🍔', categoria ? categoria.trim() : 'Otros', id]
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
    const result = await pool.query('SELECT id, nombre FROM categorias ORDER BY nombre ASC');
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
  const { nombre } = req.body;
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
    const result = await pool.query(
      'INSERT INTO categorias (nombre) VALUES ($1) RETURNING id, nombre',
      [nombre.trim()]
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
  const { nombre } = req.body;
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
    await client.query('UPDATE categorias SET nombre = $1 WHERE id = $2', [catNombreNuevo, id]);

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

// Endpoint de Registrar Pedido
app.post('/api/pedidos', async (req, res) => {
  const { cliente_nombre, total, atendido_por, productos, nota, tipo_entrega, tipo_transaccion } = req.body;

  if (!cliente_nombre || !total || !atendido_por || !productos || !Array.isArray(productos) || productos.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Datos del pedido incompletos o inválidos.'
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insertar la cabecera del pedido
    const orderRes = await client.query(
      'INSERT INTO pedidos (cliente_nombre, total, atendido_por, nota, tipo_entrega, tipo_transaccion) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, fecha_hora',
      [cliente_nombre.trim(), total, atendido_por.trim(), nota ? nota.trim() : null, tipo_entrega || 'Servir', tipo_transaccion || 'Efectivo']
    );
    const pedidoId = orderRes.rows[0].id;
    const fechaHora = orderRes.rows[0].fecha_hora;

    // 2. Insertar cada producto y descontar ingredientes del inventario
    for (const item of productos) {
      // Registrar el producto en el detalle del pedido
      await client.query(
        'INSERT INTO pedido_productos (pedido_id, producto_id, nombre_producto, cantidad, precio_unitario) VALUES ($1, $2, $3, $4, $5)',
        [pedidoId, item.id || null, item.nombre, item.cantidad, item.precio]
      );

      // Descontar stock si el producto tiene ingredientes asociados
      if (item.id) {
        const recipeRes = await client.query(
          'SELECT ingrediente_id, cantidad FROM producto_ingredientes WHERE producto_id = $1',
          [item.id]
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
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', dp.id,
                   'producto_id', dp.producto_id,
                   'nombre_producto', dp.nombre_producto,
                   'cantidad', dp.cantidad,
                   'precio_unitario', dp.precio_unitario
                 )
               ) FILTER (WHERE dp.id IS NOT NULL),
               '[]'
             ) as productos
      FROM pedidos p
      LEFT JOIN pedido_productos dp ON p.id = dp.pedido_id
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

// Endpoint de Cierre de Caja del Día
app.get('/api/informes/cierre', async (req, res) => {
  const { fecha } = req.query; // YYYY-MM-DD
  if (!fecha) {
    return res.status(400).json({ success: false, message: 'La fecha es requerida.' });
  }

  try {
    const result = await pool.query(`
      SELECT 
        COALESCE(SUM(total), 0)::FLOAT as total_ventas,
        MIN(id) as ticket_inicio,
        MAX(id) as ticket_fin,
        COALESCE(SUM(CASE WHEN tipo_transaccion = 'Efectivo' THEN total ELSE 0 END), 0)::FLOAT as total_efectivo,
        COALESCE(SUM(CASE WHEN tipo_transaccion = 'Débito' THEN total ELSE 0 END), 0)::FLOAT as total_debito,
        COALESCE(SUM(CASE WHEN tipo_transaccion = 'Crédito' THEN total ELSE 0 END), 0)::FLOAT as total_credito
      FROM pedidos
      WHERE DATE(fecha_hora) = $1
    `, [fecha]);

    const row = result.rows[0];
    const total_ventas = row.total_ventas;
    const ticket_inicio = row.ticket_inicio;
    const ticket_fin = row.ticket_fin;
    const total_efectivo = row.total_efectivo;
    const total_debito = row.total_debito;
    const total_credito = row.total_credito;
    const total_tarjeta = total_debito + total_credito;

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
        total_tarjeta
      }
    });
  } catch (err) {
    console.error('Error en GET /api/informes/cierre:', err.message);
    res.status(500).json({ success: false, message: 'Error al obtener el informe de cierre.' });
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
        COALESCE(SUM(CASE WHEN tipo_transaccion = 'Efectivo' THEN total ELSE 0 END), 0)::FLOAT as total_efectivo,
        COALESCE(SUM(CASE WHEN tipo_transaccion IN ('Débito', 'Crédito') THEN total ELSE 0 END), 0)::FLOAT as total_tarjeta,
        COALESCE(SUM(total), 0)::FLOAT as total_ventas
      FROM pedidos
      WHERE TO_CHAR(fecha_hora, 'YYYY-MM') = $1
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
      WHERE DATE(p.fecha_hora) >= $1 AND DATE(p.fecha_hora) <= $2
      GROUP BY dp.nombre_producto
      ORDER BY cantidad DESC
    `, [fecha_inicio, fecha_fin]);

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
      const sumaTotal = result.rows.reduce((sum, r) => sum + r.total, 0);
      
      // Fila vacía para separación estética
      rows.push({
        'Producto': '',
        'Cantidad Vendida': '',
        'Total Vendido ($)': ''
      });

      // Fila con los totales generales
      rows.push({
        'Producto': 'TOTAL GENERAL',
        'Cantidad Vendida': sumaCantidad,
        'Total Vendido ($)': sumaTotal
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


// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend escuchando en http://localhost:${PORT}`);
});
