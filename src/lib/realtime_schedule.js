import db from './db'

export function getCarRealtimeInfo(car) {
  return new Promise((resolve, reject) => {
    let carId = car.id
    let sql = `SELECT * FROM "realtime_schedule" WHERE "CarId" = ?;`
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
    let sql = `UPDATE "realtime_schedule" SET "Status" = ? WHERE "CarId" = ?;`
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
      let sql = `UPDATE "realtime_schedule" SET "PointId" = ?, "LastPointId" = ? WHERE "CarId" = ?;`
      let params = [status, carId]
      db.run(sql, ...params, (err, row) => {
        if (err) throw err
        if (!row) return null
      })
    })
  })
}
