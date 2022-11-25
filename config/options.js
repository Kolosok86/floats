import * as errors from '../constants/errors.js'
import { logger } from '../services/logger.js'
import { conf } from './index.js'
import Redis from 'ioredis'

const rate = conf.get('rate_limit')

const redis = new Redis()

export const helmet = {
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

export const ratelimit = {
  errorMessage: errors.RateLimit,
  id: (ctx) => ctx?.request?.headers['x-real-ip'] || ctx?.ip,
  disableHeader: true,
  duration: 60000,
  max: rate,
  driver: 'redis',
  db: redis,
}

export const log = {
  transporter: (str, args) => {
    logger.debug(str, args)
  },
}
