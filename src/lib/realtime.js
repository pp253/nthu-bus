import db from './db'
import { getPossibleSchedule } from './schedule'
import { getTime } from './time'

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
export function reset() {
  return new Promise((resolve, reject) => {
    let sql = 'SELECT * FROM "realtime_schedule";'
    db.all(sql, (err, rows) => {
      if (err) throw err
      realtime = {}
      for (let row of rows) {
        realtime[row.id] = row
      }
      resolve(realtime)
    })
  })
}

export function save() {}

export function getRealtimeBySchedule(scheduleId) {
  let item = realtime.find(v => v.ScheduleId === scheduleId)
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
    let departureTime = new Date(item.DepartureTime)
    if (
      departureTime < getTime() - RELAX_WIDTH ||
      departureTime > getTime() + RELAX_WIDTH
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
  if (!(status in STATUS)) throw new Error('Status not valid')
  item.Status = status
  return item
}

export function setRealtimePoint(scheduleId, pointId, gpsTime) {
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
    let item = realtime[id]
    if (item.Status !== STATUS.UNBEGUN) {
      continue
    }
    let departureTime = new Date(item.DepartureTime)
    if (departureTime < getTime() - RELAX_WIDTH) {
      continue
    }
    setRealtimeStatus(item.ScheduleId, STATUS.MISSING)
    missingSchedule.push(item.ScheduleId)
  }
  return missingSchedule
}

export function getCarRealtimeInfo(car) {
  return new Promise((resolve, reject) => {
    let carId = car.id
    let sql = 'SELECT * FROM "realtime_schedule" WHERE "CarId" = ?;'
    let params = [carId]
    db.get(sql, ...params, (err, row) => {
      if (err) throw err
      resolve(row)
    })
  })
}

export function updateCarStatus(car, status) {
  return new Promise((resolve, reject) => {
    let carId = car.id
    let sql = 'UPDATE "realtime_schedule" SET "Status" = ? WHERE "CarId" = ?;'
    let params = [status, carId]
    db.run(sql, ...params, err => {
      if (err) throw err
      resolve(true)
    })
  })
}

export function updateCarPosition(car, status) {
  return new Promise((resolve, reject) => {
    let carId = car.id
    getCarRealtimeInfo(carId).then(row => {
      let sql =
        'UPDATE "realtime_schedule" SET "PointId" = ?, "LastPointId" = ? WHERE "CarId" = ?;'
      let params = [status, carId]
      db.run(sql, ...params, (err, row) => {
        if (err) throw err
        if (!row) return null
      })
    })
  })
}

reset()
