import db from './db'
import { getResponsibleSchedule } from './assignments'
import { getDay } from './time'

let schedule = {}
const WEEKDAY = {
  0: 'U',
  1: 'M',
  2: 'T',
  3: 'W',
  4: 'R',
  5: 'F',
  6: 'S'
}

export function reset() {
  return new Promise((resolve, reject) => {
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
    if (!responsibleSchedule.includes(id)) {
      continue
    }
    let item = schedule[id]
    // 2) weekday matched
    if (item[WEEKDAY[weekday]] !== 1) {
      continue
    }
    possibleSchedule.push(id)
  }
  return possibleSchedule
}

reset()
