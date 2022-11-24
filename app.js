import Koa from 'koa'

import { Controller } from './components/controller.js'
import { setProperties } from './middlewares/setController.js'
import { conf } from './config/index.js'
import middlewares from './middlewares/index.js'
import { GameData } from './components/game_data.js'
import { logger } from './services/logger.js'
import bots from './constants/bots.js'
import routes from './routes/index.js'

const PORT = conf.get('port')

const app = new Koa()
const controller = new Controller()
const gameData = new GameData()

controller.addBots(bots)

app.use(setProperties(controller, gameData))
app.use(middlewares())
app.use(routes())

app.listen(PORT, () => {
  logger.info('Server listening on port: %s', PORT)
})
