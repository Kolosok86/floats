const errors = require('../components/errors')
const logger = require('../services/logger')
const Redis = require('ioredis')
const conf = require("../config")

const rate = conf.get('rate_limit')

const redis = new Redis()

module.exports.helmet = {
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: true,
  expectCt: false,
  dnsPrefetchControl: true,
  frameguard: true,
  hidePoweredBy: true,
  hpkp: false,
  hsts: true,
  ieNoOpen: true,
  noCache: false,
  noSniff: true,
  referrerPolicy: false,
  xssFilter: true,
}

module.exports.ratelimit = {
  errorMessage: errors.RateLimit,
  id: (ctx) => ctx.ip,
  disableHeader: true,
  duration: 60000,
  max: rate,
  driver: 'redis',
  db: redis,
}

module.exports.logger = {
  transporter: (str, args) => {
    logger.debug(str, args)
  },
}
