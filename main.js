import path from 'path'
import https from 'https'
import http from 'http'
import fs from 'fs'
import express from 'express'
import helmet from 'helmet'
import bodyParser from 'body-parser'
import compression from 'compression'
import cors from 'cors'
import io from './src/lib/io'

import { getData } from './src/spider'

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
app.set('port', 3000 || process.env.PORT)
app.set('title', 'NTHU BUS')

// Static
app.use('/', express.static('public'))

// Routes
app.get('/api/get_data', function (req, res) {
    res.json(getData())
})

app.get('/echo', function(req, res) {
    res.send('echo')
})

app.get('*', function(req, res) {
    res.status(404).send('404 NOT FOUND')
})


const server = app.listen(app.get('port'), () => {
    console.log(`Start to listen on PORT ${app.get('port')} ...`)
})

io.attach(server, {
    pingInterval: 10 * 1000,
    pingTimeout: 5 * 1000
})
