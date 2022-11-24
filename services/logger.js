import { conf } from '../config/index.js'
import winston from 'winston'

const { createLogger, format, transports } = winston
const { combine, timestamp, printf, colorize } = format
const { splat, json, errors } = format

const myFormat = printf((info) => {
  return `${info.timestamp} [${info.level}]: ${info.message}${info?.stack || ''}`
})

const options = {
  level: 'error',
  filename: `logs/error.log`,
  handleExceptions: true,
  json: true,
  maxsize: 5242880,
  maxFiles: 5,
}

export const logger = createLogger({
  level: conf.get('logLevel'),
  exitOnError: true,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    splat(),
    json(),
    colorize(),
    myFormat
  ),
  transports: [
    new transports.File(options),
    new transports.Console({
      handleExceptions: true,
    }),
  ],
})
