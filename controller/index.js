import { InspectURL } from '../components/inspect_url.js'
import { removeNullValues } from '../utils/index.js'
import { getItemData, createItem } from '../database/mongo.js'
import { throwError } from '../services/errors.js'
import * as errors from '../constants/errors.js'
import { logger } from '../services/logger.js'

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
    throwError(ctx, errors.InvalidInspect)
    return next()
  }

  const link = new InspectURL(url)
  // validate inspect url
  if (!link.valid) {
    throwError(ctx, errors.InvalidInspect)
    return next()
  }

  // check item in mongo db
  const result = await getItemData(link)
  if (result) return sendResp(ctx, next, result)

  // check available bots
  if (!ctx.controller.hasBotOnline()) {
    throwError(ctx, errors.SteamOffline)
    return next()
  }

  const item = await ctx.controller.execute(link).catch((err) => {
    logger.debug(err)
  })

  // empty response from steam
  if (!item) {
    throwError(ctx, errors.TTLExceeded)
    return next()
  }

  sendResp(ctx, next, item)
  // insert item to mongo db
  await createItem(item)
}

export function getStats(ctx, next) {
  const data = ctx.controller.getCount()

  ctx.ok(data)
  return next()
}
