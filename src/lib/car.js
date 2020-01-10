import db from './db'
import { updateCarStatus, STATUS } from './realtime'
import {
  fitToPoint,
  getTerminalStation,
  getRoutingOf,
  inExpectedPointsOf
} from './point'
import { getPreparedSchedule, setRealtimePoint, setCarToRealtime, setRealtimeStatus } from './realtime'
import { getRouteIdByScheduleId } from './schedule'

let cars = {}

export function reset() {
  new Promise((resolve) => {
    let sql = 'SELECT * from "cars";'
    db.all(sql, (err, rows) => {
      if (err) throw err
      if (!rows) throw new Error('No cars found.')
      for (let row of rows) {
        cars[row.id] = row
      }
      resolve(cars)
    })
  })
}

export function getCarIdByNo(carNo) {
  for (let id in cars) {
    if (cars[id].CarNo === carNo) {
      return id
    }
  }
  throw new Error('Cannot find the car.')
}

export class Car {
  constructor(carNo) {
    this.carNo = carNo

    // set by loadByCarNo()
    this.id = null
    this.type = null
    this.driver = null

    // set by user
    this.px = null
    this.py = null
    this.pointId = null
    this.lastPointId = null
    this.gpsTime = null

    this.routeId = null
    this.scheduleId = null

    this.loadByCarNo(carNo)
  }

  loadByCarNo(carNo) {
    this.carNo = carNo
    this.id = getCarIdByNo(carNo)
    this.type = cars[this.id].CarType
    this.driver = cars[this.id].Driver
  }

  reset() {
    this.routeId = null
    this.scheduleId = null
  }

  updateGPSPosition(px, py, gpsTime) {
    this.px = px
    this.py = py
    let pointId = fitToPoint(px, py)
    this.updatePoint(pointId, gpsTime)
  }

  updatePoint(pointId, gpsTime) {
    this.lastPointId = this.pointId
    this.pointId = pointId
    this.gpsTime = gpsTime
    if (this.routeId) {
      setRealtimePoint(this.scheduleId, this.pointId, this.gpsTime)
    }
  }

  fitToSchedule() {
    const RELAX_WIDTH = 5 * 60 * 1000
    const EXCEED_WIDTH = 5 * 60 * 1000 + RELAX_WIDTH

    // if the current schedule is no longer available
    // 1) the car has rach the terminal station
    // 2) Is not in the expected range of road
    // 3) Time exceed too much
    if (this.routeId) {
      let route = getRoutingOf(this.routeId)
      if (
        this.pointId === getTerminalStation(this.routeId) ||
        Date.now() - (route.DepartureTime + route.ExpectedRunningLength) >
          EXCEED_WIDTH ||
        !inExpectedPointsOf(this)
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
    let preparedSchedule = getPreparedSchedule(this.id)
    if (preparedSchedule && preparedSchedule.length > 0) {
      this.scheduleId = preparedSchedule[0]
      this.routeId = getRouteIdByScheduleId(this.scheduleId)
      setCarToRealtime(this.scheduleId, this.id)
      setRealtimeStatus(this.scheduleId, STATUS.ONGOING)
      setRealtimePoint(this.scheduleId, this.pointId, this.gpsTime)
    }
  }
}
