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
  InvalidInspect: new Error('Invalid Inspect Link Structure', 1, 400),
  TTLExceeded: new Error(`Valve's servers didn't reply in time`, 2, 500),
  SteamOffline: new Error(`Valve's servers appear to be offline, please try again later`, 3, 503),
  NoBotsAvailable: new Error('No bots available to fulfill this request', 4, 500),
  RateLimit: new Error('Rate limit exceeded, too many requests', 5, 429),
}
