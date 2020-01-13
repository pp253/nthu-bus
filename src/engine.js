import { predictAllRoutes } from './predict'
import { track } from './track'
import {Car, getCarIdByNo} from './lib/car'
import { setAllMissingSchedule } from './lib/realtime'
import * as realtime from './lib/realtime'
import * as car from './lib/car'
import * as point from './lib/point'
import * as schedule from './lib/schedule'
import * as assignments from './lib/assignments'
import logger from './lib/logger'

let prediction = {}
let cars = {}
let loaded = false

export function getPrediction() {
  return prediction
}

export function isPeek(){

}

export async function reload() {
  // Phase 1
  await car.reset()
  await schedule.reset()
  await point.reset()
  await assignments.reset()
  await logger.info('Reloaded phase 1 success.')

  // Phase 2
  await realtime.reset()
  logger.info('Reloaded phase 2 success.')

  return true
}

export async function save() {
  await realtime.save()
  console.log('save realtime')
}

export async function runCycle() {
  
  // 0) if in non peek, skip the cycle, and reload
  if (!isPeek()) {
    
  }

  // 1) spider.getAllBusInfo()
  let data = await track()

  // 2) car.updateGPSPosition()
  for (let carInfo of data) {
    let carId = getCarIdByNo(carInfo.CarNo)
    if (!(carId in cars)) {
      cars[carId] = new Car(carInfo.CarNo)
    }
    let car = cars[carId]
    car.updateGPSPosition(carInfo.PX, carInfo.PY, carInfo.GPSTime)
  }
  
  // 3) car.fitToSchedule()
  for (let id in cars) {
    let car = cars[id]
    car.fitToSchedule()
  }

  // 4) set all missing schedule
  let missing = setAllMissingSchedule()
  logger.info('Missing schedule', missing)

  // 5) predictAllRoutes()
  prediction = predictAllRoutes()
  console.log(prediction)

  // 6) save all change to sql
  await save()
}

export async function startCycle() {
  if (!loaded) {
    await reload()
    loaded = true
  }
  await runCycle()
}
