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
    default: 'mongodb://mongo:27017/floats?authSource=admin',
    env: 'MONGO',
  },
})

conf.validate()

export { conf }
