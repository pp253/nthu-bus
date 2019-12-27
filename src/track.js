import * as spider from './spider'
import sqlite3 from 'sqlite3'
import db from './lib/db'

export function getHistoryData(filter) {
  return new Promise((resolve, reject) => {
    let whereclause = ''
    if (filter) {
      let conditions = []
      if (filter['CarNo']) {
        if (filter['CarNo'].includes('%')) {
          conditions.push(`CarNo LIKE '${filter['CarNo']}'`)
        } else {
          conditions.push(`CarNo = '${filter['CarNo']}'`)
        }
      }
      if (filter['Driver']) {
        let driver = filter['Driver']
        if (driver.includes('%')) {
          conditions.push(`Driver LIKE '${driver}'`)
        } else {
          conditions.push(`Driver = '${driver}'`)
        }
      }
      if (filter['GPSTimeFrom'] && filter['GPSTimeTo']) {
        conditions.push(
          `GPSTime BETWEEN '${filter['GPSTimeFrom']}' AND '${filter['GPSTimeTo']}'`
        )
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
    console.log(sql)

    db.all(sql, [], function(err, rows) {
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
    db.run(sql, function(err) {
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
    let currentHour = new Date().getHours()
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
