export function setProperties(controller, gameData) {
  return async function (ctx, next) {
    ctx.controller = controller
    ctx.gameData = gameData

    await next()
  }
}
