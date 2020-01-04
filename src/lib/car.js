import db from './db'
import {updateCarStatus, STATUS} from './realtime_schedule'
import { fitToPoint, getStartingStation, getTerminalStation, getRoute } from './point'

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

  reset() {
    this.routeId = null
    this.scheduleId = null
  }

  fitToPoint() {
    if (this.routeId) {
      this.position = fitToPoint(this.px, this.py)
    } else {
      this.position = fitToPoint(this.px, this.py)
    }
    return this.position
  }

  fitToSchedule() {
    const RELAX_WIDTH = 5 * 60 * 1000
    const EXCEED_WIDTH = 5 * 60 * 1000 + RELAX_WIDTH

    // if the current schedule is no longer available
    // 1) the car has rach the terminal station
    // 2) Is not in the expected range of road
    // 3) Time exceed too much
    if (this.routeId) {
      let route = getRoute(this.routeId)
      if (
        this.position === getTerminalStation(this.routeId) ||
        Date.now() - (route.DepartureTime + route.ExpectedRunningLength) > EXCEED_WIDTH ||
        !inExpectedPoints(this)
        ) {
        updateCarStatus(this, STATUS.FINISH)
        this.reset()
      } else {
        return this.scheduleId
      }
    }

    
    // if the car should be registered to a new schedule
    // first of all, the car can't be assigned to a route right now
    // 1) in the relax_width, the bus has already on the route
    let responsibleSchedule = 


  }
}
