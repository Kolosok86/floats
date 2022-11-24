import * as opts from '../constants/options.js'
import { errorHandler } from './errorHandler.js'
import convert from 'koa-convert'
import logger from 'koa-logger'
import ratelimit from 'koa-ratelimit'
import helmet from 'koa-helmet'
import respond from 'koa-respond'

const middlewares = [
  respond(),
  errorHandler,
  logger(opts.log),
  ratelimit(opts.ratelimit),
  helmet(opts.helmet),
]

export default () => convert.compose(middlewares)
