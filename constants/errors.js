export default {
  InvalidInspect: { msg: `Invalid Inspect Link Structure`, status: 400 },
  TTLExceeded: { msg: `Valve's servers didn't reply in time`, status: 400 },
  NoBotsAvailable: { msg: `No bots available to fulfill this request`, status: 500 },
  SteamOffline: { msg: `Valve's servers offline, please try again later`, status: 503 },
  Unexpected: { msg: `Internal Server error`, status: 500 },
}
