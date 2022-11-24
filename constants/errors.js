function Error(msg, status) {
  this.status = status
  this.msg = msg
}

// prettier-ignore
export const SteamOffline = new Error(`Valve's servers appear to be offline, please try again later`, 503)
export const InvalidInspect = new Error('Invalid Inspect Link Structure', 400)
export const TTLExceeded = new Error(`Valve's servers didn't reply in time`, 500)
export const NoBotsAvailable = new Error('No bots available to fulfill this request', 500)
export const RateLimit = new Error('Rate limit exceeded, too many requests', 429)
