import log4js from 'log4js'


log4js.configure({
  appenders: {
    'console': { type: 'console' },
    'email': {
      type: '@log4js-node/smtp',
      recipients: 'pp.pp253@gmail.com',
      transport: 'SMTP',
      SMTP: {
        host: 'localhost',
        port: 25,
        tls: { rejectUnauthorized: false }
      }
    },
    'sendcriticalerror': {
      type: 'logLevelFilter', 
      level: 'error', 
      appender:  'email'
    },
  },
  categories: {
    default: {
      appenders: [ 'sendcriticalerror', 'console' ],
      level: 'trace'
    }
  },
  pm2: true
})


const logger = log4js.getLogger()

export default logger
