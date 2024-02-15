import errors from '../constants/errors.js'

export class Catcher {
  constructor() {
    this.InvalidInspect = 0
    this.SteamOffline = 0
    this.TTLExceeded = 0
    this.NoBotsAvailable = 0
    this.Unexpected = 0
  }

  clearErrors() {
    this.InvalidInspect = 0
    this.SteamOffline = 0
    this.TTLExceeded = 0
    this.NoBotsAvailable = 0
    this.Unexpected = 0
  }

  getError(type) {
    if (!(type in errors)) return {}
    this.addError(type)

    return errors[type]
  }

  addError(type) {
    this[type]++
  }
}

export function throwError(ctx, type) {
  const error = ctx.catcher.getError(type || 'Unexpected')

  ctx.body = { message: error.msg }
  ctx.status = error.status
}
