const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbFile = process.env.SQLITE_FILE || path.join(__dirname, 'bomberos.db');
const db = new sqlite3.Database(dbFile, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
    throw err;
  }
});

db.exec('PRAGMA foreign_keys = ON;');

const all = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

const get = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
});

const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) {
    if (err) {
      return reject(err);
    }
    resolve(this);
  });
});

const exec = (sql) => new Promise((resolve, reject) => {
  db.exec(sql, (err) => (err ? reject(err) : resolve()));
});

const transaction = async (fn) => {
  await exec('BEGIN TRANSACTION');
  try {
    const result = await fn();
    await exec('COMMIT');
    return result;
  } catch (error) {
    await exec('ROLLBACK');
    throw error;
  }
};

module.exports = {
  db,
  all,
  get,
  run,
  exec,
  transaction,
};
