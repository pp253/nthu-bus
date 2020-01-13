import db from './db'
import { getResponsibleSchedule } from './assignments'
import { getDay, parseTimeString, getTimeOfNow } from './time'

let schedule = {}
export const WEEKDAY = {
  0: 'U',
  1: 'M',
  2: 'T',
  3: 'W',
  4: 'R',
  5: 'F',
  6: 'S'
}

export function reset() {
  return new Promise((resolve) => {
    let sql = 'SELECT * FROM "schedule";'
    db.all(sql, (err, rows) => {
      if (err) throw err
      schedule = {}
      for (let row of rows) {
        schedule[row.id] = row
      }
      resolve(schedule)
    })
  })
}

/**
 *
 * @param {CarId} carId
 * @returns {ScheduleId[]} possibleSchedule
 */
export function getPossibleSchedule(carId) {
  let weekday = getDay()
  let responsibleSchedule = getResponsibleSchedule(carId)
  let possibleSchedule = []
  for (let id in schedule) {
    // 1) id in responsible_schedule
    if (!responsibleSchedule.includes(parseInt(id))) {
      continue
    }
    let item = schedule[id]
    // 2) weekday matched
    if (item[WEEKDAY[weekday]] !== 1) {
      continue
    }
    possibleSchedule.push(parseInt(id))
  }
  return possibleSchedule
}

export function getScheduleById(scheduleId) {
  return schedule[scheduleId]
}

export function getSchedulesByRoute(routeId) {
  let list = []
  for (let id in schedule) {
    let item = schedule[id]
    if (parseInt(item.RouteId) !== parseInt(routeId)) {
      continue
    }
    list.push(parseInt(id))
  }
  return list
}

export function getRouteIdByScheduleId(scheduleId) {
  return schedule[scheduleId].RouteId
}

export function getNextDepartureTime(routeId) {
  let nowTime = getTimeOfNow()
  let schedules  = getSchedulesByRoute(routeId)
  for (let id of schedules) {
    let row = schedule[id]
    let departureTime = parseTimeString(row.DepartureTime)
    // in the future
    if (nowTime < departureTime) {
      return departureTime
    }
  }
  return null
}

export function getSchedulesByDay(day) {
  let schedules = []
  for (let id in schedule) {
    let row = schedule[id]
    if (row[WEEKDAY[day]] === 1){
      schedules.push(row)
    }
  }
  return schedules
}

export function getSchedules() {
  return schedule
}
