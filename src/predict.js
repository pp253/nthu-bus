import db from './lib/db'
import { getRealtimeByRouteAndPoint } from './lib/realtime'
import { transpose } from './utils'
import { getMainRoutesOf, getSubRoutesOf, getSubRouteKey, getRouting } from './lib/point'
import { getNextDepartureTime } from './lib/schedule'
import { getDateOfNow } from './lib/time'


let prediction = {}


export function reset() {
  return new Promise((resolve) => {
    let sql = 'SELECT * FROM "routing_prediction";'
    db.all(sql, (err, rows) => {
      if (err) throw err

      prediction = {}

      for (let row of rows) {
        prediction[row.id] = row
      }
      resolve(prediction)
    })
  })
}

export function getPrediction(routeId, fromPointId, toPointId) {
  for (let id in prediction) {
    let row = prediction[id]
    if (row.RouteId === routeId && row.FromPointId === fromPointId && row.ToPointId === toPointId) {
      return row
    }
  }
  throw new Error(`Cannot find prediction. routeId=${routeId}, (${fromPointId}, ${toPointId})`)
}

export function getPredictionByRouteId(routeId) {
  let list = []
  for (let id in prediction) {
    let row = prediction[id]
    if (row.RouteId === routeId) {
      list.push(row)
    }
  }
  return list
}

export function getPredictionTimeMean(routeId, fromPointId, toPointId) {
  return getPrediction(routeId, fromPointId, toPointId).TimeMean * 1000
}

function getTimeOf (time) {
  let date = new Date(time)
  if (date.getTime() < getDateOfNow()) {
    return  Infinity
  }
  // console.log(time, date.getTime(), getDateOfNow(), new Date().getTimezoneOffset() * 60 * 1000)
  return date.getTime() - getDateOfNow() // - new Date().getTimezoneOffset() * 60 * 1000
}

export function predict(routeId) {
  let active = {}
  routeId = parseInt(routeId)


  for (let pt of getPredictionByRouteId(routeId)) {
    let oriDf = getRealtimeByRouteAndPoint(routeId, pt.FromPointId)
    let df = transpose(oriDf)

    active[getSubRouteKey(pt)] = {
      CarId: df.CarId,
      MinGPSTime: df.GPSTime ? Math.min(...df.GPSTime.map(getTimeOf)) : Infinity
    }
    if (df.GPSTime) {
      // console.log(routeId, df.GPSTime.map(getTimeOf))
    }
  }
  // console.log(active)

  let predicted = {}
  let routes = getMainRoutesOf(routeId)
  let cumOffset = 0
  let timebase = 0
  for (let idx = 0; idx < routes.length; idx++) {
    // if stn is terminal stop
    if (idx === routes.length - 1) {
      continue
    }
    // console.log('main:', idx, routes[idx])

    let stn = routes[idx]
    let nextStn = routes[idx + 1]

    // FIXME: 要不要排除掉還沒出站的公車? 
    let subRoutes = getSubRoutesOf({FromPointId: stn, ToPointId: nextStn})

    // if subStn is the starting point, skip
    for (let subIdx = 1; subIdx < subRoutes.length; subIdx++) {
      let subStn = subRoutes[subIdx]
      let prevSubStn = subRoutes[subIdx - 1]

      // if it's starting stop
      if (getPrediction(routeId, prevSubStn, subStn).DepartureStation === 1) {
        // predicted[stn] = next departure time of route in schedule table
        let nextDepartureTime = getNextDepartureTime(routeId)
        if (!predicted[stn] || predicted[stn] > nextDepartureTime) {
          predicted[stn] = nextDepartureTime
          timebase = nextDepartureTime
          // console.log('         set timebase', timebase, nextDepartureTime)
        }
      }

      let timeMean = getPredictionTimeMean(routeId, prevSubStn, subStn)
      cumOffset += timeMean
      
      // if there's a car right on the point, change time baseline
      let tmpActive = active[getSubRouteKey({FromPointId: prevSubStn, ToPointId: subStn})]
      // console.log(getSubRouteKey({FromPointId: prevSubStn, ToPointId: subStn}), tmpActive)
      if (tmpActive.CarId && tmpActive.CarId.length > 0) {
        timebase = tmpActive.MinGPSTime
        cumOffset = 0
        // console.log('active')
      }
      // console.log('    sub:', subIdx, subStn, cumOffset, timebase, timeMean)
    }

    predicted[nextStn] = cumOffset + timebase
  }
  return predicted
}

export function predictAllRoutes() {
  let prediction = {}
  let mainRouting = getRouting()
  for (let id in mainRouting) {
    let routing = mainRouting[id]
    let routingLabel = routing.Label
    // console.log(routingLabel)
    prediction[routingLabel] = predict(id)
  }
  return prediction
}

reset()
