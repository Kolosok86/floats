const { compose } = require('koa-convert')
const logger = require('koa-logger')
const helmet = require('koa-helmet')
const ratelimit = require('koa-ratelimit')

const opts = require('./options')

const middlewares = [logger(opts.logger), ratelimit(opts.ratelimit), helmet(opts.helmet)]

module.exports = () => compose(middlewares)
