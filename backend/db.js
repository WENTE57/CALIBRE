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

function isValidSqlite(filePath) {
  try {
    if (!fs.existsSync(filePath)) return false;
    const stats = fs.statSync(filePath);
    if (stats.size === 0) return true; // SQLite puede inicializar un archivo vacío
    if (stats.size < 16) return false;
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(16);
    fs.readSync(fd, buf, 0, 16, 0);
    fs.closeSync(fd);
    return buf.toString('utf8', 0, 15) === 'SQLite format 3';
  } catch (e) {
    return false;
  }
}

function restoreTemplateDb(targetPath) {
  const exeDir = process.env.USER_DATA_PATH ? path.dirname(process.env.USER_DATA_PATH) : __dirname;
  const candidates = [
    path.join(__dirname, 'database.sqlite'),
    path.join(__dirname, '../backend/database.sqlite'),
    path.join(process.resourcesPath || '', 'database.sqlite'),
    path.join(exeDir, 'database.sqlite')
  ];
  for (const cand of candidates) {
    if (cand && fs.existsSync(cand) && cand !== targetPath && isValidSqlite(cand)) {
      try {
        fs.copyFileSync(cand, targetPath);
        console.log(`[SQLite] Base de datos restaurada desde plantilla: ${cand}`);
        return true;
      } catch (e) {}
    }
  }
  return false;
}

async function initDatabase() {
  const openAndVerify = async (file) => {
    const db = await open({
      filename: file,
      driver: sqlite3.Database
    });
    console.log('✅ Conexión exitosa a la base de datos SQLite local ("' + file + '")');
    try { await db.exec('PRAGMA journal_mode = WAL'); } catch (e) {}
    try { await db.exec('PRAGMA foreign_keys = ON'); } catch (e) {}
    await db.get('SELECT 1');
    return db;
  };

  try {
    // Si el archivo existe pero no es SQLite válido (por ejemplo, alguien copió un .sql o archivo de texto)
    if (fs.existsSync(dbPath) && !isValidSqlite(dbPath)) {
      console.warn(`[SQLite] Advertencia: ${dbPath} no es una base de datos SQLite válida.`);
      const backupPath = path.join(userDataPath, `database_no_valida_${Date.now()}.bak`);
      try { fs.renameSync(dbPath, backupPath); } catch (e) {}
      restoreTemplateDb(dbPath);
    }

    return await openAndVerify(dbPath);
  } catch (err) {
    console.error(`[SQLite] Error abriendo base de datos (${err.message}). Intentando recuperación de WAL...`);
    // Limpiar posibles archivos WAL/SHM huérfanos o con conflicto de versión
    try {
      if (fs.existsSync(dbPath + '-wal')) fs.unlinkSync(dbPath + '-wal');
      if (fs.existsSync(dbPath + '-shm')) fs.unlinkSync(dbPath + '-shm');
    } catch (e) {}

    try {
      return await openAndVerify(dbPath);
    } catch (err2) {
      console.error(`[SQLite] Segundo intento falló (${err2.message}). Creando respaldo y cargando base de datos limpia...`);
      const corruptPath = path.join(userDataPath, `database_corrupta_${Date.now()}.sqlite`);
      try { fs.renameSync(dbPath, corruptPath); } catch (e) {}
      restoreTemplateDb(dbPath);
      return await openAndVerify(dbPath);
    }
  }
}

const dbPromise = initDatabase().catch(err => {
  console.error('❌ Error crítico irrecuperable en SQLite:', err);
  return null;
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
    // Ignorar errores de columna o índice duplicado al simular "ADD COLUMN IF NOT EXISTS"
    if (err.message && (err.message.includes('duplicate column name') || err.message.includes('already exists'))) {
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
    if (!db) {
      console.error('[SQLite] Intento de consulta sin conexión activa a la base de datos');
      return { rows: [] };
    }
    return executeQuery(db, text, params);
  },
  connect: async () => {
    const db = await dbPromise;
    if (!db) {
      return {
        query: async () => ({ rows: [] }),
        release: () => {}
      };
    }
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
