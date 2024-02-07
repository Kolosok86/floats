import { logger } from '../services/logger.js'

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
