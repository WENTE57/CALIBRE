const express = require('express');
const cors = require('cors');
const pool = require('./db');
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




// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend escuchando en http://localhost:${PORT}`);
});
