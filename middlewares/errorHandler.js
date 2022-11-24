import { getBoom } from '../services/errors.js'
import { logger } from '../services/logger.js'

export async function errorHandler(ctx, next) {
  try {
    await next()
  } catch (err) {
    logger.error(err)

    const boom = getBoom()
    ctx.internalServerError(boom)
  }
}
