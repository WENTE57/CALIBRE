const pool = require('./db');

const setup = async () => {
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
  } catch (err) {
    console.error('❌ Error configurando la base de datos:', err);
  } finally {
    await pool.end();
    process.exit();
  }
};

setup();
