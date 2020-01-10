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
    let assign = assignments[id]
    if (assign.CarId === carId) {
      responsibleSchedule.push(assign.ScheduleId)
    }
  }
  return responsibleSchedule
}
