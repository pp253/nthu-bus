import log4js from 'log4js'


log4js.configure({
  appenders: {
    'email': {
      type: '@log4js-node/smtp', recipients: 'pp.pp253@gmail.com'
    }
    
  },
  categories: { default: { appenders: [ 'email' ], level: 'error' } },
  pm2: true
})


const logger = log4js.getLogger()
logger.level = 'debug'

export default logger
