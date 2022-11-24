import convict from 'convict'
import dotenv from 'dotenv'

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
  mongo: {
    doc: 'Url to mongo db',
    format: String,
    default: 'mongodb://localhost:27017/example?authSource=admin',
    env: 'MONGO',
  },
  rate_limit: {
    doc: 'Rate limit to user per minute',
    format: 'int',
    default: 1,
    env: 'RATE_LIMIT',
  },
})

conf.validate()

export { conf }
