import * as opts from '../config/options.js'
import { errorHandler } from './errorHandler.js'
import bodyParser from 'koa-bodyparser'
import convert from 'koa-convert'
import logger from 'koa-logger'
import helmet from 'koa-helmet'
import respond from 'koa-respond'

const middlewares = [
  respond(),
  errorHandler,
  logger(opts.log),
  bodyParser(opts.bodyparser),
  helmet(opts.helmet),
]

export default () => convert.compose(middlewares)
