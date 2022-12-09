import { conf } from '../config/index.js'
import { logger } from '../services/logger.js'
import ItemsModel from '../models/Items.js'
import mongoose from 'mongoose'

const MONGO = conf.get('mongo')

mongoose.set('strictQuery', true)
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

// prettier-ignore
export function createItem(item) {
  return ItemsModel.updateOne({
    a: item.a,
  }, item, {
    upsert: true,
  })
}

export function getItemData(link) {
  return ItemsModel.findOne({ a: link.a }).lean()
}
