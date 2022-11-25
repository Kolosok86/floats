import { conf } from '../config/index.js'
import { logger } from '../services/logger.js'
import ItemsModel from '../models/Items.js'
import mongoose from 'mongoose'

const MONGO = conf.get('mongo')

mongoose.connect(MONGO, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
})

mongoose.connection.on('open', () => {
  logger.info('Mongo database is ready!')
})

mongoose.connection.on('error', (err) => {
  logger.error(err)
  process.exit(1)
})

export function getItemData(link) {
  return ItemsModel.findOne({ a: link.a }).lean()
}

export function createItem(item) {
  return ItemsModel.create(item)
}
