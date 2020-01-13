import {Simulator} from './src/simulator'
let sim = new Simulator()
import fs from 'fs'
import { getRoutingOf, getSubRoutes, getRouting, getSubRoutesOf, getPoints, getMainRoutesOf } from './src/lib/point'
import { getCars } from './src/lib/car'
import { getSchedules } from './src/lib/schedule'

sim.start().then(result => {
  let predictions = result.predictions
  let positions = result.positions
  
  let obj = {}

  obj['startTime'] = result.startTime
  obj['endTime'] = result.endTime
  obj['timeStep'] = result.timeStep

  // predictions
  obj['predictions'] = predictions

  // positions
  obj['positions'] = positions

  // schedules
  obj['schedules'] = getSchedules()

  // cars
  obj['cars'] = getCars()

  // points
  obj['points'] = getPoints()

  // routing and routes
  obj['routing'] = {}
  obj['routes'] = {}
  let mainRouting = getRouting()
  for (let routeId in mainRouting) {
    let row =  mainRouting[routeId]
    let label = row.Label
    obj['routing'][label] = getRoutingOf(routeId)
    obj['routes'][label] = getMainRoutesOf(routeId)
  }

  // subRoutes
  let subRoutes = getSubRoutes()
  obj['subRoutes'] = subRoutes

  let json = JSON.stringify(obj)
  fs.writeFile('simulation.json', json, 'utf8', function (err) {
    if (err) throw err
    console.log('success')
  })
})

