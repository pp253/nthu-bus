import * as spider from './spider'
import sqlite3 from 'sqlite3'

const FILENAME = 'db/track.db'

const db = new sqlite3.Database(FILENAME, function(err){
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
    )
    `
    db.exec(sql, function (err) {
        if (err) throw err
        console.log('successfuly connect to database and create table')
    })
})

export function getHistoryData(filter) {
    return new Promise((resolve, reject) => {
        let whereclause = ''
        let conditions = []
        if (filter) {
            for (let key in filter) {
                switch (key) {
                    case 'CarNo':
                        conditions.push(`CarNo = '${filter[key]}'`)
                        break
                    case 'Driver':
                        conditions.push(`Driver = '${filter[key]}'`)
                        break
                    default: break
                }
            }
            if (filter['GPSTimeFrom'] && filter['GPSTimeTo']) {
                conditions.push(`GPSTime BETWEEN '${filter['GPSTimeFrom']}' AND '${filter['GPSTimeTo']}'`)
            }
            if (filter['PXFrom'] && filter['PXTo']) {
                if (filter['PXFrom'] > filter['PXTo']) {
                    reject('PXFrom should be less than PXTo.')
                    return
                }
                conditions.push(`PX BETWEEN ${filter['PXFrom']} AND ${filter['PXTo']}`)
            }
            if (filter['PYFrom'] && filter['PYTo']) {
                if (filter['PYFrom'] > filter['PYTo']) {
                    reject('PYFrom should be less than PYTo.')
                    return
                }
                conditions.push(`PY BETWEEN ${filter['PYFrom']} AND ${filter['PYTo']}`)
            }
            if (conditions.length > 0) {
                whereclause = ` WHERE ((${conditions.join(') AND (')}))`
            }
        }
        let sql = `SELECT * FROM bushistory${whereclause};`
        
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
                // silent error
            } else {
                resolve(true)
            }
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
            resolve(data)
        })
    })
}


const PEEK_TRACK_INTERVAL = 30 * 1000
const NOT_PEEK_TRACK_INTERVAL = 10 * 60 * 1000
const PEEK = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]
let trackingTimerId

export function startTracking() {
    if (trackingTimerId) {
        return false
    }
    setTimeout(function _startTracking() {
        let nextInterval = NOT_PEEK_TRACK_INTERVAL
        let currentHour = (new Date()).getHours()
        if (PEEK.includes(currentHour)) {
            nextInterval = PEEK_TRACK_INTERVAL
        } else {
            nextInterval = NOT_PEEK_TRACK_INTERVAL
        }

        track()
            .then(() => {
                trackingTimerId = setTimeout(_startTracking, nextInterval)
            })
            .catch(err => {
                console.error(err)
            })
    }, 0)
    return true
}

export function stopTracking() {
    if (!trackingTimerId) {
        return false
    }
    clearTimeout(trackingTimerId)
}