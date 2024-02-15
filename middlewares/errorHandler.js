import { throwError } from '../components/catcher.js'
import { logger } from '../services/logger.js'

export async function errorHandler(ctx, next) {
  try {
    await next()
  } catch (err) {
    logger.error(err)

    throwError(ctx, 'Unexpected')
    ctx.catcher.addError()
  }
}
