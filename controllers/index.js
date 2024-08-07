import { InspectURL } from '../components/inspect_url.js'
import { removeNullValues } from '../utils/index.js'
import { getItemData, createItem } from '../database/mongo.js'
import { throwError } from '../components/catcher.js'
import { logger } from '../services/logger.js'
import os from 'os'

function sendResp(ctx, next, result) {
  ctx.gameData.addAdditionalItemProperties(result)
  result = removeNullValues(result)

  // delete stats fields
  delete result.updatedAt
  delete result.createdAt
  delete result._id

  ctx.ok(result)
  return next()
}

export async function handleFloatReq(ctx, next) {
  const url = ctx?.query?.url
  // check url field exists
  if (!url) {
    throwError(ctx, 'InvalidInspect')
    return next()
  }

  const link = new InspectURL(url)
  // validate inspect url
  if (!link.valid) {
    throwError(ctx, 'InvalidInspect')
    return next()
  }

  // check item in mongo db
  const result = await getItemData(link)
  if (result) return sendResp(ctx, next, result)

  // check available bots
  if (!ctx.controller.hasBotOnline()) {
    throwError(ctx, 'SteamOffline')
    return next()
  }

  const item = await ctx.controller.execute(link).catch((err) => {
    logger.warn('Error in check item %s', err?.message || err)
    throwError(ctx, err?.message)
  })

  // empty response from steam
  if (!item) {
    return next()
  }

  sendResp(ctx, next, item)
  // insert item to mongo db
  await createItem(item)
}

export async function getDescriptions(ctx, next) {
  const { data } = ctx.request.body
  if (!data) {
    throwError(ctx, 'InvalidInspect')
    return next()
  }

  const bot = ctx.controller.getBotByCounter()
  const response = await bot.getClassInfo(data)

  ctx.ok(response)
  return next()
}

export function getHealth(ctx, next) {
  const data = ctx.controller.getCount()

  ctx.ok({
    host: os.hostname(),
    uptime: Math.floor(process.uptime() * 1000),
    ...ctx.catcher,
    ...data,
  })

  ctx.catcher.clearErrors()

  return next()
}
