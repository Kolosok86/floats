import errors from '../constants/errors.js'

export class Catcher {
  constructor() {
    this.InvalidInspect = 0
    this.SteamOffline = 0
    this.TTLExceeded = 0
    this.NoBotsAvailable = 0
  }

  clearErrors() {
    this.InvalidInspect = 0
    this.SteamOffline = 0
    this.TTLExceeded = 0
    this.NoBotsAvailable = 0
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
