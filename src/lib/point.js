import db from './db'

class Point {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.name = null
    this.id = null
  }

  loadByPointId(pointId) {
    new Promise((resolve) => {
      let sql = 'SELECT * FROM "points" WHERE "id" = ?;'
      let params = [pointId]
      db.get(sql, ...params, (err, row) => {
        if (err) throw err
        if (!row) throw new Error('Missing point.')
        this.id = row.id
        this.name = row.Name
        resolve(this)
      })
    })
  }
}

let points = {}
let mainRouting = {} // id => row
let mainRoutes = {}  // id => row.Routes in list
let subRouting = {}
let subRoutes = {}

export function getPoints() {
  return points
}

/**
 * 
 * @param {SubRoute} subRoute 
 */
export function getSubRouteKey(subRoute) {
  return `${subRoute.FromPointId},${subRoute.ToPointId}`
}

export function reset() {
  return new Promise((resolve) => {
    Promise.resolve()
      .then(() => {
        return new Promise((resolve) => {
          let sql = 'SELECT * FROM "main_routing";'
          db.all(sql, (err, rows) => {
            if (err) throw err

            mainRouting = {}
            mainRoutes = {}

            for (let row of rows) {
              mainRouting[row.id] = row
              let routes = row.Routes.split(',').map(v => parseInt(v))
              mainRoutes[row.id] = routes
            }
            resolve()
          })
        })
      })
      .then(() => {
        return new Promise((resolve) => {
          let sql = 'SELECT * FROM "sub_routing";'
          db.all(sql, (err, rows) => {
            if (err) throw err

            subRouting = {}
            subRoutes = {}

            for (let row of rows) {
              let label = getSubRouteKey(row)
              subRouting[label] = row
              let routes = row.Routes.split(',').map(v => parseInt(v))
              subRoutes[label] = routes
            }
            resolve()
          })
        })
      })
      .then(() => {
        return new Promise((resolve) => {
          let sql = 'SELECT * FROM "points";'
          db.all(sql, (err, rows) => {
            if (err) throw err
            points = {}
            for (let row of rows) {
              points[row.id] = row
            }
            resolve()
          })
        })
      })
      .then(() => resolve())
  })
}

export function getStartingStation(routeId) {
  return mainRoutes[routeId][0]
}

export function getTerminalStation(routeId) {
  return parseInt(mainRoutes[routeId][mainRoutes[routeId].length - 1])
}

export function getRouting() {
  return mainRouting
}

export function getRoutingOf(routeId) {
  return mainRouting[routeId]
}

export function getAllPointsOf(routeId, fromPointId) {
  let points = []
  let begin = fromPointId ? false : true
  let routes = mainRoutes[routeId]
  for (let idx = 0; idx < routes.length; idx++) {
    if (idx === routes.length - 1) {
      continue
    }
    let stn = routes[idx]
    let nextStn = routes[idx + 1]
    let subRouteKey = getSubRouteKey({ FromPointId: stn, ToPointId: nextStn })
    for (let subStn of subRoutes[subRouteKey]) {
      if (subStn === parseInt(fromPointId)) {
        begin = true
      }
      // console.log(routeId, subStn, parseInt(fromPointId), begin)
      if (begin) {
        points.push(parseInt(subStn))
      }
    }
  }
  return points
}

/**
 * 
 * @param {Car} car 
 */
export function inExpectedPointsOf(car) {
  // console.log(getAllPointsOf(car.routeId, car.lastPointId), car.pointId)
  if (!car.routeId) {
    return true
  } else if (getAllPointsOf(car.routeId, car.lastPointId).includes(parseInt(car.pointId))) {
    return true 
  } else {
    return false
  }
}

export function getMainRoutes() {
  return mainRoutes
}

export function getSubRoutes() {
  return subRoutes
}

export function getMainRoutesOf(routeId) {
  return mainRoutes[routeId]
}

export function getSubRoutesOf(fromPointId, toPointId) {
  return subRoutes[getSubRouteKey(fromPointId, toPointId)]
}

function argmin(input_list) {
  let c = 0
  let min = 0
  for (let i of input_list){
    if (i < input_list[min]){
      min = c
    }
    c = c + 1
  }
  return min
}

function calLossIndex(px, py, PX, PY) {
  const MUL_FACTOR = 10000
  return (((px - PX)*MUL_FACTOR) ** 2 + ((py - PY)*MUL_FACTOR) ** 2)
}

/**
 * 
 * @param {*} px 
 * @param {*} py 
 * @returns {Point} point
 */
export function fitToPoint(px, py){
  let buff = []
  for (let s in points){
    buff.push(calLossIndex(px,py,points[s]['PX'],points[s]['PY']))
  }
  if (Math.max(...buff) > 20000){
    return 0
  }
    
  let keep = argmin(buff)
  return Object.keys(points)[keep]
}
