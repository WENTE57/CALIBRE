const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json()); // Permite procesar peticiones JSON

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


// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend escuchando en http://localhost:${PORT}`);
});
