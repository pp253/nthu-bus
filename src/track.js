import * as spider from './spider'
import sqlite3 from 'sqlite3'

const FILENAME = 'db/track.db'

const db = new sqlite3.Database(FILENAME, function(err){
    if (err) throw err

    let sql = `
    CREATE TABLE IF NOT EXISTS "bushistory" (
        "id"	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
        "CarNo"	INTEGER,
        "GPSTime"	TEXT,
        "PX"	REAL,
        "PY"	REAL,
        "Speed"	INTEGER,
        "Angle"	INTEGER,
        "Driver"	TEXT
    )
    `
    db.exec(sql, function (err) {
        if (err) throw err
        console.log('successfuly connect to database and create table')
    })
})

export function getHistory(filter) {
    return new Promise((resolve, reject) => {
        let sql = `SELECT * FROM bushistory;`
        db.all(sql, [], function (err, rows) {
            if (err) throw err
            resolve(rows)
        })
    })
}

export function log(carInfo) {
    return new Promise((resolve, reject) => {
        let sql = `
        INSERT INTO "bushistory"
        ("CarNo", "GPSTime", "PX", "PY", "Speed", "Angle", "Driver")
        VALUES ("${carInfo.CarNo}", "${carInfo.Cur_GPSTime}", "${carInfo.Cur_PX}", "${carInfo.Cur_PY}", "${carInfo.Speed}", "${carInfo.Angle}", "${carInfo.DriverNo}");`
        db.run(sql, function (err) {
            if (err) {
                console.error(err)
                reject(err)
                return
            }
            resolve(true)
        })
    })
}


export function track() {
    return new Promise((resolve, reject) => {
        spider.getAllBusInfo().then(data => {
            if (!data || data.length === 0) {
                reject(false)
                return
            }
            for (let carInfo of data) {
                log(carInfo)
            }
        })
    })
}


const PEEK_TRACK_INTERVAL = 30 * 1000
const NOT_PEEK_TRACK_INTERVAL = 10 * 60 * 1000
const PEEK = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]
let trackingTimerId

export function startTracking() {
    setTimeout(function _startTracking() {
        let nextInterval = NOT_PEEK_TRACK_INTERVAL
        let currentHour = (new Date()).getHours()
        if (PEEK.includes(currentHour)) {
            nextInterval = NOT_PEEK_TRACK_INTERVAL
        } else {
            nextInterval = PEEK_TRACK_INTERVAL
        }

        track()
            .then(() => {
                trackingTimerId = setTimeout(_startTracking, nextInterval)
            })
            .catch(err => {
                console.error(err)
            })
    }, 0)
}

export function stopTracking() {
    if (!trackingTimerId) {
        return
    }
    clearTimeout(trackingTimerId)
}