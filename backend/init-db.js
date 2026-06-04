const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbFile = process.env.SQLITE_FILE || path.join(__dirname, 'db', 'bomberos.db');

const schemaPath = path.join(__dirname, 'db', 'schema.sql');

const db = new sqlite3.Database(dbFile, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Error al abrir la base de datos:', err.message);
    process.exit(1);
  }
});

db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON');

  try {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema, (err) => {
      if (err) {
        console.error('Error al inicializar la base de datos:', err.message);
        process.exit(1);
      }
      db.close();
      console.log(`Base de datos creada o actualizada en: ${dbFile}`);
    });
  } catch (error) {
    console.error('Error al leer el esquema de la base de datos:', error.message);
    process.exit(1);
  }
});
