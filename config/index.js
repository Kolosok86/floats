const dotenv = require('dotenv')
const convict = require('convict')

dotenv.config()

const conf = convict({
  env: {
    doc: 'The application environment.',
    format: ['production', 'development'],
    default: 'development',
    env: 'NODE_ENV',
  },
  logLevel: {
    doc: 'Winston log level',
    format: ['debug', 'info'],
    default: 'debug',
    env: 'LOG_LEVEL',
  },
  port: {
    doc: 'The port to bind.',
    format: 'port',
    default: 80,
    env: 'PORT',
  },
  postgres: {
    doc: 'URL to db.',
    format: String,
    default: 'postgres://postgres:postgres@localhost:5432/example?sslmode=disable',
    env: 'POSTGRES_URL',
  },
  rate_limit: {
    doc: 'Rate limit to user per minute',
    format: 'int',
    default: 1,
    env: 'RATE_LIMIT',
  }
})

conf.validate()

module.exports = conf
