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

export const InvalidInspect = new Error('Invalid Inspect Link Structure', 1, 400)
export const TTLExceeded = new Error(`Valve's servers didn't reply in time`, 2, 500)
export const SteamOffline = new Error(`Valve's servers appear to be offline, please try again later`, 3, 503)
export const NoBotsAvailable = new Error('No bots available to fulfill this request', 4, 500)
export const RateLimit = new Error('Rate limit exceeded, too many requests', 5, 429)
