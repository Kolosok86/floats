import { logger } from '../services/logger.js'

export const bodyparser = {
  enableTypes: ['json'],
  jsonLimit: '1mb',
  textLimit: '1mb',
  strict: true,
  onerror: function (err, ctx) {
    ctx.throw(400, {
      msg: 'json parse error',
    })
  },
}

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

export const log = {
  transporter: (str, args) => {
    logger.debug(str, args)
  },
}
