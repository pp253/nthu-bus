import express from 'express'
import helmet from 'helmet'
import bodyParser from 'body-parser'
import compression from 'compression'
import cors from 'cors'
import log4js from 'log4js'
import io from './src/lib/io'
import * as spider from './src/spider'
import * as track from './src/track'
import logger from './src/lib/logger'
import {startCycle} from './src/engine'

const app = express()

// Security
app.use(helmet())

// Allow CORS
app.use(cors())

// Compression
app.use(compression({ credentials: true, origin: true }))

// Body parser and Validator
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Setting
app.set('port', 80 || process.env.PORT)
app.set('title', 'NTHU BUS')

// Logger
app.use(log4js.connectLogger(logger, { level: 'auto' }))

// Static
app.use('/', express.static('public'))

// Routes
app.get('/api/getRealtimeData', function(req, res) {
  res.json({})
})

app.get('/api/getSchedule', function(req, res) {
  res.json({})
})

app.get('/api/getHistoryData', function(req, res) {
  let filter = req.query
  track
    .getHistoryData(filter)
    .then(data => {
      res.json(data)
    })
    .catch(err => {
      logger.error(err)
      res.json({ error: 1, err: err })
    })
})

app.get('/api/getHistoryDataCSV', function(req, res) {
  let filter = req.query
  track
    .getHistoryData(filter)
    .then(data => {
      res.write('標籤, 車牌, 時間, 緯度, 經度, 車速, 角度, 司機\n')

      for (let row of data) {
        res.write(
          [
            row['CarNo'] + ':' + row['GPSTime'],
            row['CarNo'],
            row['GPSTime'],
            row['PY'],
            row['PX'],
            row['Speed'],
            row['Angle'],
            row['Driver']
          ].join(', ') + '\n'
        )
      }
      res.end()
    })
    .catch(err => {
      logger.error(err)
      res.json({ error: 1, err: err })
    })
})

app.get('/api/getAllBusInfo', function(req, res) {
  spider
    .getAllBusInfo()
    .then(data => {
      res.json(data)
    })
    .catch(err => {
      logger.error(err)
      res.json({ error: 1, err: err })
    })
})

app.get('/api/startTracking', function(req, res) {
  track.startTracking()
  res.send('success')
})

app.get('/api/stopTracking', function(req, res) {
  track.stopTracking()
  res.send('success')
})

app.get('/echo', function(req, res) {
  res.send('echo')
})

app.get('*', function(req, res) {
  res.status(404).send('404 NOT FOUND')
})

// Listening
const server = app.listen(app.get('port'), () => {
  logger.info(`Start listening on PORT ${app.get('port')} ...`)

  // track.startTracking()

  startCycle()
})

io.attach(server, {
  pingInterval: 10 * 1000,
  pingTimeout: 5 * 1000
})
