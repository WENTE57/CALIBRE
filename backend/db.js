const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// En modo de desarrollo, la base de datos se guarda en la misma carpeta.
// Usar la ruta de datos del usuario proporcionada por Electron (si está empaquetado) o la ruta actual (desarrollo)
const userDataPath = process.env.USER_DATA_PATH || __dirname;
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}
const dbPath = path.join(userDataPath, 'database.sqlite');

const dbPromise = open({
  filename: dbPath,
  driver: sqlite3.Database
}).then(async (db) => {
  console.log('✅ Conexión exitosa a la base de datos SQLite local ("' + dbPath + '")');
  // Activar modo WAL (Write-Ahead Logging) para mejor concurrencia y velocidad
  await db.exec('PRAGMA journal_mode = WAL');
  // Activar soporte de llaves foráneas
  await db.exec('PRAGMA foreign_keys = ON');
  return db;
}).catch(err => {
  console.error('❌ Error abriendo la base de datos SQLite:', err);
  throw err;
});

// Función central para ejecutar consultas y simular la respuesta de PostgreSQL (pg)
const executeQuery = async (db, text, params) => {
  let sql = text;
  let values = params;

  // Manejar el formato de consulta de objeto (si se pasara así en algún momento)
  if (typeof text === 'object' && text.text) {
    sql = text.text;
    values = text.values || params;
  }

  // Convertir placeholders de PostgreSQL ($1, $2) a SQLite (?1, ?2) y ajustar sintaxis no soportada
  if (sql) {
    sql = sql.replace(/\$(\d+)/g, '?$1');
    sql = sql.replace(/ADD COLUMN IF NOT EXISTS/gi, 'ADD COLUMN');
    sql = sql.replace(/json_agg/gi, 'json_group_array');
    sql = sql.replace(/json_build_object/gi, 'json_object');
    sql = sql.replace(/::[a-zA-Z]+/g, ''); // Elimina ::FLOAT, ::INTEGER, ::json, etc
  }

  try {
    // sqlite db.all() ejecuta la consulta y devuelve un arreglo de filas.
    // Esto funciona bien incluso para INSERT/UPDATE/DELETE con RETURNING en versiones recientes de SQLite3.
    // Si la consulta no devuelve nada (ej. un UPDATE sin RETURNING), devolverá un arreglo vacío,
    // lo cual es compatible con la estructura { rows: [] } que espera el backend originalmente.
    const rows = await db.all(sql, values || []);
    return { rows };
  } catch (err) {
    // Ignorar errores de columna duplicada al simular "ADD COLUMN IF NOT EXISTS"
    if (err.message && err.message.includes('duplicate column name')) {
      return { rows: [] };
    }
    // console.error(`Error ejecutando query SQLite: ${sql}`, err);
    throw err;
  }
};

// Simulamos la interfaz de `pg.Pool` para que el resto de la aplicación (index.js, seed.js) 
// siga funcionando sin cambiar cada llamada a pool.query() o client.query()
const pool = {
  query: async (text, params) => {
    const db = await dbPromise;
    return executeQuery(db, text, params);
  },
  connect: async () => {
    const db = await dbPromise;
    // Simulamos un "client" que el backend adquiere para transacciones (BEGIN, COMMIT, ROLLBACK)
    return {
      query: async (text, params) => {
        return executeQuery(db, text, params);
      },
      release: () => {
        // En SQLite usando sqlite3, no hay necesidad de "soltar" la conexión al pool
        // de la misma manera que en pg, simplemente no hacemos nada.
      }
    };
  },
  end: async () => {
    // Simulamos el cierre del pool
  }
};

module.exports = pool;
