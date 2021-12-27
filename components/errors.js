class Error {
  constructor(message, internalCode, statusCode) {
    this.message = message
    this.code = internalCode
    this.statusCode = statusCode
  }

  getJSON() {
    return {
      error: this.message,
      code: this.code,
      status: this.statusCode,
    }
  }

  respond(ctx) {
    ctx.status = this.statusCode
    ctx.body = this.getJSON()
  }

  toString() {
    return `[Code ${this.code}] - ${this.message}`
  }
}

module.exports = {
  BadParams: new Error('Improper Parameter Structure', 1, 400),
  InvalidInspect: new Error('Invalid Inspect Link Structure', 2, 400),
  MaxRequests: new Error(`You have too many pending requests`, 3, 400),
  TTLExceeded: new Error(`Valve's servers didn't reply in time`, 4, 500),
  SteamOffline: new Error(`Valve's servers appear to be offline, please try again later`, 5, 503),
  GenericBad: new Error('Something went wrong on our end, please try again', 6, 500),
  BadBody: new Error('Improper body format', 7, 400),
  NoBotsAvailable: new Error('No bots available to fulfill this request', 8, 500),
  RateLimit: new Error('Rate limit exceeded, too many requests', 9, 429),
}
