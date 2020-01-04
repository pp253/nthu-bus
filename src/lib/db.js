import sqlite3 from 'sqlite3'
import logger from './logger'

const FILENAME = 'db/track.db'

const db = new sqlite3.Database(FILENAME, function(err) {
  if (err) throw err

  let sql = `
    CREATE TABLE IF NOT EXISTS "bushistory" (
        "id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
        "CarNo"	TEXT,
        "GPSTime"	TEXT,
        "PX"	REAL,
        "PY"	REAL,
        "Speed"	INTEGER,
        "Angle"	INTEGER,
        "Driver"	TEXT,
        CONSTRAINT unq UNIQUE (CarNo, GPSTime)
    );
    `
  db.exec(sql, function(err) {
    if (err) throw err
    logger.info('Successfuly connect to database and create table')
  })
})
export default db
