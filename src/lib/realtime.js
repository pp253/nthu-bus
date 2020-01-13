import db from './db'
import { getPossibleSchedule, getSchedulesByRoute, getSchedulesByDay, getScheduleById } from './schedule'
import { getDay, parseTimeString, getTimeOfNow } from './time'
import logger from './logger'

export const STATUS = {
  UNBEGUN: 0,
  ONGOING: 1,
  FINISH: 2,
  MISSING: 3
}
export const RELAX_WIDTH = 5 * 60 * 1000 // in ms

let realtime = {}

/**
 * TODO: Should import from schedule on a daily basis
 */
export async function reset() {
  await importFromSchedule()
}

export function importFromSchedule() {
  new Promise((resolve) => {
    let day = getDay()
    let schedules = getSchedulesByDay(day)
    logger.info(`Realtime: Import from schedule day ${day}, loaded schedules: ${schedules.map(v => v.id)}.`)

    db.run('DELETE FROM "realtime_schedule";', function (err) {
      if (err) throw err

      let valuesClause = []
      for (let row of schedules) {
        let params = [row.id, STATUS.UNBEGUN]
        valuesClause.push(params.join(', '))
      }
      let sql = `INSERT INTO "realtime_schedule" (ScheduleId, Status) VALUES (${valuesClause.join('), (')});`
        
      db.run(sql, function(err) {
        if (err) throw err
        
        let sql = 'SELECT * FROM "realtime_schedule";'
        db.all(sql, (err, rows) => {
          if (err) throw err
          realtime = {}
          for (let row of rows) {
            realtime[row.id] = row
          }
          logger.info('Successfully load realtime.')
          resolve(realtime)
        })
      })
    })
  })
}

export function save() {
  new Promise((resolve) => {
    db.serialize(function () {
      for (let id in realtime) {
        let row = realtime[id]
        let keys = Object.keys(row)
        let setClause = []
        let params = []
        for (let key of keys) {
          if (key === 'id') {
            continue
          }
          if (row[key] === null) {
            continue
          }
          setClause.push(`"${key}"=?`)
          params.push(row[key])
        }
        let sql = `UPDATE "realtime_schedule" SET ${setClause.join(', ')} WHERE "id"='${id}';`
        db.run(sql, ...params)
      }
      resolve()
    })
  })
}

export function getRealtimeBySchedule(scheduleId) {
  let item
  for (let key in realtime) {
    if (realtime[key].ScheduleId === scheduleId) {
      item = realtime[key]
    }
  }
  if (!item) throw new Error('Realtime Schedule not found')
  return item
}

/**
 *
 * @param {CarId} carId
 * @returns {ScheduleId[]} preparedSchedule
 */
export function getPreparedSchedule(carId) {
  let possibleSchedule = getPossibleSchedule(carId)
  let preparedSchedule = []
  for (let id in realtime) {
    let item = realtime[id]
    let scheduleId = item.ScheduleId

    // should be in the possibleSchedule
    if (!possibleSchedule.includes(scheduleId)) {
      continue
    }

    // 3) being Unbegun in realtime_schedule[scheduleId == id]
    if (getRealtimeBySchedule(scheduleId).Status !== STATUS.UNBEGUN) {
      continue
    }

    // 4) DepartureTime BETWEEN now() - relax_width AND now() + relax_width
    let schedule = getScheduleById(scheduleId)
    let departureTime = parseTimeString(schedule.DepartureTime)
    if (
      departureTime < getTimeOfNow() - RELAX_WIDTH ||
      departureTime > getTimeOfNow() + RELAX_WIDTH
    ) {
      continue
    }
    preparedSchedule.push(scheduleId)
  }
  return preparedSchedule
}

export function setCarToRealtime(scheduleId, carId) {
  let item = getRealtimeBySchedule(scheduleId)
  if (item.CarId) throw new Error('Realtime Schedule CarId has been set')
  item.CarId = carId
  return item
}

export function setRealtimeStatus(scheduleId, status) {
  let item = getRealtimeBySchedule(scheduleId)
  item.Status = status
  return item
}

export function setRealtimePoint(scheduleId, pointId, gpsTime) {
  // TODO: check pointId is in the expected points

  let item = getRealtimeBySchedule(scheduleId)
  item.LastPointId = item.PointId
  item.PointId = pointId
  item.GPSTime = gpsTime
  return item
}

export function setRealtime(scheduleId, payload) {
  setRealtimeStatus(scheduleId, payload.Status)
  setRealtimePoint(scheduleId, payload.PointId, payload.GPSTime)
}

/**
 * @returns {ScheduleId[]} missingSchedule
 */
export function setAllMissingSchedule() {
  let missingSchedule = []
  for (let id in realtime) {
    let row = realtime[id]
    if (row.Status !== STATUS.UNBEGUN) {
      continue
    }
    let schedule = getScheduleById(row.ScheduleId)
    let departureTime = parseTimeString(schedule.DepartureTime)
    if (departureTime > getTimeOfNow() - RELAX_WIDTH) {
      continue
    }
    setRealtimeStatus(row.ScheduleId, STATUS.MISSING)
    missingSchedule.push(row.ScheduleId)
  }
  return missingSchedule
}

export function getRealtimeByRoute(routeId) {
  let rows = []
  let schedules = getSchedulesByRoute(parseInt(routeId))
  for (let id in realtime) {
    let item = realtime[id]
    if (schedules.includes(parseInt(item.ScheduleId))) {
      rows.push(item)
    }
    // console.log(schedules, parseInt(item.RouteId), item.ScheduleId)
  }
  // console.log(rows)
  return rows
}

export function getRealtimeByRouteAndPoint(routeId, pointId) {
  let rows = getRealtimeByRoute(routeId)
  return rows.filter(v => parseInt(v.PointId) === parseInt(pointId) && v.Status === STATUS.ONGOING)
}
