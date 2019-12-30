import db from './db'

class Car {
  constructor(carNo) {
    this.carNo = carNo

    // set by loadByCarNo()
    this.id = null
    this.type = null
    this.driver = null

    // set by user
    this.px = null
    this.py = null
    this.position = null
    this.gpstime = null

    this.routeId = null
    this.scheduleId = null

    this.loadByCarNo(carNo)
  }

  loadByCarNo(carNo) {
    new Promise((resolve, reject) => {
      let sql = `SELECT * from "cars" WHERE "CarNo" = ?;`
      let params = [carNo]
      db.get(sql, ...params, (err, row) => {
        if (err) throw err
        if (!row) throw Error('Missing Car.')
        this.id = row.id
        this.type = row.CarType
        this.driver = row.Driver
        resolve(this)
      })
    })
  }

  fitToPoint() {
    if (this.routeId) {

    } else {
      
    }
  }
}
