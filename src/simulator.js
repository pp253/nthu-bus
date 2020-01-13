import { setDate } from './lib/time'
import * as realtime from './lib/realtime'
import * as car from './lib/car'
import * as point from './lib/point'
import * as schedule from './lib/schedule'
import * as assignments from './lib/assignments'
import logger from './lib/logger'
import { predictAllRoutes } from './predict'
import { Car, getCarIdByNo } from './lib/car'
import { setAllMissingSchedule } from './lib/realtime'
import db from './lib/db'


export class Simulator{
  constructor() {
    this.startTime = new Date('2020-1-8 06:50:00')
    this.endTime = new Date('2020-1-8 23:00:00')
    this.timeStep = 30 * 1000 // in ms
    this.now = this.startTime.getTime()

    this.finish = false

    this.cars = {}

    // history
    this.predictions = []
    this.positions = []
  }

  async reset() {
    // Set the time
    let date = new Date(this.startTime)
    setDate(date)

    // Phase 1
    await car.reset()
    await schedule.reset()
    await point.reset()
    await assignments.reset()

    // Phase 2
    await realtime.reset()

    logger.info('Reset simulator')

    return true
  }

  async run() {
    // 1) Set the date
    let date = new Date(this.now)
    setDate(date)

    logger.info(date.toLocaleTimeString())

    // 2) Get historical tracking data
    let data = await this.getHistoricalTrackingData(date)

    // 3) car.updateGPSPosition()
    for (let carInfo of data) {
      let carId = getCarIdByNo(carInfo.CarNo)
      if (!(carId in this.cars)) {
        this.cars[carId] = new Car(carInfo.CarNo)
      }
      let car = this.cars[carId]
      car.updateGPSPosition(carInfo.PX, carInfo.PY, carInfo.GPSTime)
    }
    
    // 4) car.fitToSchedule()
    for (let id in this.cars) {
      let car = this.cars[id]
      car.fitToSchedule()
    }

    // 5) set all missing schedule
    let missing = setAllMissingSchedule()
    if (missing.length > 0) {
      logger.info('Missing schedule', missing)
    }

    // 6) predictAllRoutes()
    let prediction = predictAllRoutes()

    // 7) Log the prediction
    this.predictions.push(prediction)

    let positionInfo = {}
    for (let id in this.cars) {
      let car = this.cars[id]
      positionInfo[id] = {
        PX: car.px,
        PY: car.py,
        PointId: car.pointId,
        LastPointId: car.lastPointId,
        GPSTime: car.gpsTime,
        RouteId: car.routeId,
        ScheduleId: car.scheduleId
      }
    }
    this.positions.push(positionInfo)

    // 8) Step forward
    this.now += this.timeStep
    if (this.now >= this.endTime.getTime()) {
      this.finish = true
    }
    return this.finish
  }

  async start() {
    await this.reset()
    
    while (!this.finish) {
      await this.run()
    }

    await realtime.save()

    return {
      startTime: this.startTime.getTime(),
      endTime: this.endTime.getTime(),
      timeStep: this.timeStep,
      predictions: this.predictions,
      positions: this.positions
    }
  }

  async getHistoricalTrackingData(date) {
    return new Promise((resolve) => {
      let sql = `
      SELECT DISTINCT "CarNo", "GPSTime", "PX", "PY", "Speed", "Angle", "Driver", max("id") as "id"
      FROM "bushistory" WHERE "GPSTime" < ?
      GROUP BY "CarNo";`
      let time = new Date(date.getTime() - date.getTimezoneOffset() * 60 * 1000)
      let params = [time.toISOString().replace('T', ' ').replace('Z', '')]
      // console.log(params)
      db.all(sql, ...params, function (err, rows) {
        if (err) throw err
        if (!rows) throw new Error('No return value.')
        resolve(rows)
      })
    })
  }
}
