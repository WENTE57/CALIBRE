const { Pool } = require('pg');
require('dotenv').config();

// Creamos un pool de conexiones a la base de datos de PostgreSQL
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Probar la conexión al iniciar
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error de conexión a la base de datos:', err.stack);
  } else {
    console.log('✅ Conexión exitosa a la base de datos PostgreSQL ("' + process.env.DB_DATABASE + '")');
    release();
  }
});

module.exports = pool;
