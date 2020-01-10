import log4js from 'log4js'
import process from 'process'
const ENV_PRODUCTION =
  'NODE_ENV' in process.env ? process.env.NODE_ENV === 'development' : false

log4js.configure({
  appenders: {
    console: { type: 'console' },
    email: {
      type: '@log4js-node/smtp',
      recipients: 'pp.pp253@gmail.com',
      transport: 'SMTP',
      SMTP: {
        host: 'localhost',
        port: 25,
        tls: { rejectUnauthorized: false }
      }
    },
    sendcriticalerror: {
      type: 'logLevelFilter',
      level: 'error',
      appender: 'email'
    }
  },
  categories: {
    default: {
      appenders: (() => {
        let appenders = ['console']
        if (ENV_PRODUCTION) {
          appenders.push('sendcriticalerror')
        }
        return appenders
      })(),
      level: 'trace'
    }
  },
  pm2: true
})

const logger = log4js.getLogger()

export default logger
