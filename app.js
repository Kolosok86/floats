import Koa from 'koa'

import { Controller } from './components/controller.js'
import { setProperties } from './middlewares/setProperties.js'
import { conf } from './config/index.js'
import middlewares from './middlewares/index.js'
import { GameData } from './components/game_data.js'
import { logger } from './services/logger.js'
import { Catcher } from './components/catcher.js'
import bots from './config/bots.js'
import routes from './routes/index.js'

const PORT = conf.get('port')

const app = new Koa()
const controller = new Controller()
const gameData = new GameData()
const cather = new Catcher()

controller.addBots(bots)
controller.runJob('1m')

app.use(setProperties(controller, gameData, cather))
app.use(middlewares())
app.use(routes())

app.listen(PORT, () => {
  logger.info('Server listening on port: %s', PORT)
})
