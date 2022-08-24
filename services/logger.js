import { conf } from "../config/index.js";
import winston from "winston";

const { createLogger, format, transports } = winston
const { combine, timestamp, printf, colorize, splat, json, errors } = format

const myFormat = printf((info) => {
  return `${info.timestamp} [${info.level}]: ${info.message}${info.stack || ''}`
})

const level = conf.get('logLevel') || 'debug'

const options = {
  level: 'error',
  filename: `logs/error.log`,
  handleExceptions: true,
  json: true,
  maxsize: 5242880,
  maxFiles: 5,
}

const logger = createLogger({
  level: level,
  format: combine(
    errors({ stack: true }),
    splat(),
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json(),
    myFormat
  ),
  transports: [new transports.Console({ handleExceptions: true }), new transports.File(options)],
  exitOnError: true,
})

export {
  logger
}
