import Koa from 'koa'

import errorHandler from 'koa-better-error-handler'
import { Controller } from './components/controller.js'
import { canSubmitPrice, ctxError, removeNullValues, respond } from './services/utils.js'
import { InspectURL } from './components/inspect_url.js'
import middlewares from './middlewares/index.js'
import { GameData } from './components/game_data.js'
import { logger } from './services/logger.js'
import { Postgres } from './components/database.js'
import * as errors from './components/errors.js'
import { conf } from './config/index.js'
import Router from 'koa-router'

const PORT = conf.get('port')

const app = new Koa()
const botController = new Controller()
const db = new Postgres()
const gameData = new GameData()

const router = new Router()
router.get('/api/float', handleJob)

app.context.api = true
app.context.onerror = errorHandler({
  logger,
})

async function handleJob(ctx, next) {
  if (!('url' in ctx?.request?.query)) {
    ctxError(ctx, errors.InvalidInspect)
    return next()
  }

  let link = new InspectURL(ctx.query.url)
  let result = await db.getItemData(link)

  if (result.length) {
    let [item] = result

    if (canSubmitPrice(link, ctx?.query?.price)) {
      db.updateItemPrice(item.a, parseInt(ctx?.query?.price))
    }

    gameData.addAdditionalItemProperties(item)
    item = removeNullValues(item)

    respond(ctx, item)
    return next()
  }

  if (!botController.hasBotOnline()) {
    ctxError(ctx, errors.SteamOffline)
    return next()
  }

  let price

  if (canSubmitPrice(link, ctx?.query?.price)) {
    price = parseInt(ctx?.query?.price)
  }

  let itemData = await botController.executeJob(link).catch((err) => {
    logger.debug(err)
  })

  if (!itemData) {
    logger.warn('ItemData not received from steam, item %s', link.getParams().a)
    ctxError(ctx, errors.TTLExceeded)
    return next()
  }

  logger.debug(`Received itemData for ${link.getParams().a}`)

  db.insertItemData(itemData, price)

  itemData = Object.assign(itemData, await db.getItemRank(itemData))
  gameData.addAdditionalItemProperties(itemData)

  itemData = removeNullValues(itemData)
  itemData.stickers = itemData.stickers.map((s) => {
    return removeNullValues(s)
  })

  respond(ctx, itemData)
  await next()
}

app.use(middlewares())
app.use(router.routes())

app.on('error', (err, ctx) => {
  logger.error('Unexpected Error, %s, %s', err.msg || err, JSON.stringify(ctx))
})

app.listen(PORT, () => {
  logger.info('Server listening on port: %s', PORT)
})
