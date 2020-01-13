import db from './db'

let assignments = {}

export function reset() {
  return new Promise((resolve) => {
    let sql = 'SELECT * FROM "assignments";'
    db.all(sql, (err, rows) => {
      if (err) throw err
      assignments = {}
      for (let row of rows) {
        assignments[row.id] = row
      }
      resolve(assignments)
    })
  })
}

/**
 *
 * @param {CarId} carId
 * @returns {ScheduleId[]} responsibleSchedule
 */
export function getResponsibleSchedule(carId) {
  let responsibleSchedule = []
  for (let id in assignments) {
    let row = assignments[id]
    if (parseInt(row.CarId) === parseInt(carId)) {
      responsibleSchedule.push(parseInt(row.ScheduleId))
    }
  }
  return responsibleSchedule
}
