export function setProperties(controller, gameData, catcher) {
  return async function (ctx, next) {
    ctx.controller = controller
    ctx.gameData = gameData
    ctx.catcher = catcher

    await next()
  }
}
