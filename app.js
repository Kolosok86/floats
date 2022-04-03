const Koa = require('koa')

const { InspectURL } = require('./components/inspect_url')
const errorHandler = require('koa-better-error-handler')
const { BotController } = require('./components/bot_controller')
const { ctxError, respond, removeNullValues, canSubmitPrice } = require('./services/utils')
const middlewares = require('./middlewares')
const { GameData } = require('./components/game_data')
const logger = require('./services/logger')
const { Postgres } = require('./components/database')
const errors = require('./components/errors')
const Router = require('koa-router')
const conf = require('./config')

const PORT = conf.get('port')

const app = new Koa()
const botController = new BotController()
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
