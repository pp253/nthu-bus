import * as spider from './spider'
import db from './lib/db'
import logger from './lib/logger'

export function getHistoryData(filter) {
  return new Promise((resolve, reject) => {
    let whereclause = ''
    let params = []
    if (filter) {
      let conditions = []
      if (filter['CarNo']) {
        if (filter['CarNo'].includes('%')) {
          conditions.push('"CarNo" LIKE ?')
        } else {
          conditions.push('"CarNo" = ?')
        }
        params.push(filter['CarNo'])
      }
      if (filter['Driver']) {
        if (filter['Driver'].includes('%')) {
          conditions.push('"Driver" LIKE ?')
        } else {
          conditions.push('"Driver" = ?')
        }
        params.push(filter['Driver'])
      }
      if (filter['GPSTimeFrom'] && filter['GPSTimeTo']) {
        conditions.push('"GPSTime" BETWEEN ? AND ?')
        params.push(filter['GPSTimeFrom'])
        params.push(filter['GPSTimeTo'])
      }
      if (filter['PXFrom'] && filter['PXTo']) {
        if (filter['PXFrom'] > filter['PXTo']) {
          reject('PXFrom should be less than PXTo.')
          return
        }
        conditions.push('"PX" BETWEEN ? AND ?')
        params.push(filter['PXFrom'])
        params.push(filter['PXTo'])
      }
      if (filter['PYFrom'] && filter['PYTo']) {
        if (filter['PYFrom'] > filter['PYTo']) {
          reject('PYFrom should be less than PYTo.')
          return
        }
        conditions.push('"PY" BETWEEN ? AND ?')
        params.push(filter['PYFrom'])
        params.push(filter['PYTo'])
      }
      if (conditions.length > 0) {
        whereclause = `WHERE ((${conditions.join(') AND (')}))`
      }
    }
    let sql = `SELECT * FROM "bushistory" ${whereclause};`

    db.all(sql, ...params, function(err, rows) {
      if (err) throw err
      resolve(rows)
    })
  })
}

export function log(carInfo) {
  return new Promise((resolve) => {
    let sql = `
        INSERT INTO "bushistory"
        ("CarNo", "GPSTime", "PX", "PY", "Speed", "Angle", "Driver")
        VALUES ("${carInfo.CarNo}", "${carInfo.Cur_GPSTime}", "${carInfo.Cur_PX}", "${carInfo.Cur_PY}", "${carInfo.Speed}", "${carInfo.Angle}", "${carInfo.DriverNo}");`
    db.run(sql, function(err) {
      if (err) {
        // silent error
        // because same GPSTime may cause SQLITE_CONSTRAINT error
      } else {
        resolve(true)
      }
    })
  })
}

export function formatToCarInfo(carInfo) {
  let info = {
    CarNo: carInfo.CarNo,
    GPSTime: carInfo.Cur_GPSTime,
    PX: carInfo.Cur_PX,
    PY: carInfo.Cur_PY,
    Speed: carInfo.Speed,
    Angle: carInfo.Angle,
    Driver: carInfo.DriverNo,
  }
  return info
}

export async function track() {
  let data = await spider.getAllBusInfo()
  if (!data || data.length === 0) {
    throw new Error('No tracking data.')
  }
  data = data.filter(v => v.CarNo)
  for (let carInfo of data) {
    log(carInfo)
  }
  return data.map(v => formatToCarInfo(v))
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
        logger.error(err)
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
