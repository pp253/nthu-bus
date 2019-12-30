import db from './db'

class Point {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.name = null
    this.id = null
  }

  loadByPointId(pointId) {
    new Promise((resolve, reject) => {
      let sql = `SELECT * FROM "points" WHERE "id" = ?;`
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
let mainRouting = {}
let mainRoutes = {}
let subRouting = {}
let subRoutes = {}

function getSubRouteKey(subRoute) {
  return `${subRoute.FromPointId},${subRoute.ToPointId}`
}

export function reset() {
  return new Promise((resolve, reject) => {
    Promise.resolve()
      .then(() => {
        return new Promise((resolve, reject) => {
          let sql = `SELECT * FROM "main_routing";`
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
        return new Promise((resolve, reject) => {
          let sql = `SELECT * FROM "sub_routing";`
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
        return new Promise((resolve, reject) => {
          let sql = `SELECT * FROM "points";`
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

export function getAllPoints(routeId, fromPointId) {
  let points = []
  let begin = fromPointId ? false : true
  let routes = mainRoutes[routeId]
  for (let idx in routes) {
    if (idx === routes.length - 1) {
      break
    }
    let stn = routes[idx]
    let nextStn = routes[idx + 1]
    let subRouteKey = getSubRouteKey({ FromPointId: stn, ToPointId: nextStn })
    for (let subStn of subRoutes[subRouteKey]) {
      if (subStn === fromPointId) {
        begin = true
      }
      if (begin) {
        points.push(subStn)
      }
    }
  }
  return points
}

export function fitToPoint(px, py) {
  return new Point()
}

reset()
