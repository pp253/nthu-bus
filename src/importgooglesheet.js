import request from 'request-promise-native'
import CSV  from 'csv-string'
import db from './lib/db'
import logger from './lib/logger'

const FILE_KEY = '1aj2n_vksxWijKVmeDxM3Xn8Y4nQ0IKtF'
const API_URI_TEMPLATE = `https://docs.google.com/spreadsheets/d/${FILE_KEY}/gviz/tq?tqx=out:csv&sheet=`
const SHEET = {
  schedule: 'schedule',
  cars: 'cars',
  points: 'points',
  main_routing: 'main_routing',
  sub_routing: 'sub_routing',
  routing_prediction: 'routing_prediction',
  assignments: 'assignments'
}


async function importFromGoogleSheet(sheet) {
  let body = await request({
    uri: API_URI_TEMPLATE + SHEET[sheet],
    method: 'get'
  })
  let parsed = CSV.parse(body)
  let header = parsed[0]
  let data = parsed.slice(1) // remove the header

  return new Promise((resolve) => {
    db.serialize(function () {
      db.run(`DELETE FROM "${sheet}";`)
      for (let row of data) {
        db.run(`INSERT INTO "${sheet}" VALUES ("${row.join('", "')}");\n`)
      }
      resolve(true)
      logger.info(`Importing ${sheet} successfully.`)
    })
  })
}

async function importAllFromGoogleSheet() {
  for (let key in SHEET) {
    logger.info(`Importing ${SHEET[key]}...`)
    importFromGoogleSheet(SHEET[key])
  }
}

importAllFromGoogleSheet()

