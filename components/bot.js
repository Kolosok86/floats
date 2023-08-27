import { getRandomVariance } from '../utils/index.js'
import GlobalOffensive from 'globaloffensive'
import { logger } from '../services/logger.js'
import SteamUser from 'steam-user'
import SteamTotp from 'steam-totp'
import ms from 'ms'

export class Bot {
  constructor({ user, pass, auth, proxy, addr }) {
    this.ready = false
    this.busy = false

    this.username = user
    this.password = pass
    this.auth = auth

    const opts = {}

    if (proxy?.startsWith('socks')) {
      opts.socksProxy = proxy
    } else if (proxy?.startsWith('http')) {
      opts.httpProxy = proxy
    }

    if (addr && !proxy) {
      opts.localAddress = addr
    }

    this.steamClient = new SteamUser(opts)
    this.csgoClient = new GlobalOffensive(this.steamClient)

    const variance = getRandomVariance()
    this.timeStep = ms('45m') + variance

    this.bindEventHandlers()
  }

  logIn() {
    const loginData = {
      twoFactorCode: SteamTotp.getAuthCode(this.auth),
      accountName: this.username,
      password: this.password,
    }

    logger.info(`Logging in ${this.username}`)

    this.steamClient.logOn(loginData)
  }

  refreshSession() {
    if (Date.now() < this.time) {
      return
    }

    if (!this.ready) {
      return
    }

    // update unix time
    this.time = Date.now() + this.timeStep

    // execute update
    this.csgoClient.refreshSession()
  }

  bindEventHandlers() {
    this.steamClient.on('error', (err) => {
      logger.error(`Error logging in ${this.username}:`, err)

      if (err.toString().includes('Proxy Authentication')) {
        this.ready = false
        return
      }

      if (err.toString().includes('Proxy connection timed out')) {
        setTimeout(() => {
          this.logIn()
        }, ms('3m'))

        return
      }

      setTimeout(() => {
        if (!this.steamClient.steamID) this.logIn()
      }, ms('1h'))
    })

    this.steamClient.on('disconnected', (eresult, msg) => {
      logger.warn(`${this.username} Logged off, reconnecting! (${eresult}, ${msg})`)
    })

    this.steamClient.on('loggedOn', () => {
      logger.info(`${this.username} Log on OK`)

      this.steamClient.gamesPlayed([], true)

      setTimeout(() => {
        this.steamClient.gamesPlayed([730], true)
      }, 3000)
    })

    this.csgoClient.on('inspectItemInfo', (itemData) => {
      if (this.resolve && this.currentRequest) {
        // Ensure the received itemid is the same as what we want
        if (itemData.itemid !== this.currentRequest.a) return

        // Clear any TTL timeout
        if (this.ttlTimeout) {
          clearTimeout(this.ttlTimeout)
          this.ttlTimeout = false
        }

        // GC requires a delay between subsequent requests
        // Figure out how long to delay until this bot isn't busy anymore
        let offset = new Date().getTime() - this.currentRequest.time
        let delay = 1100 - offset

        // If we're past the request delay, don't delay
        if (delay < 0) delay = 0

        itemData.s = this.currentRequest.s
        itemData.a = this.currentRequest.a
        itemData.d = this.currentRequest.d
        itemData.m = this.currentRequest.m

        // If the paintseed is 0, the proto returns null, force 0
        itemData.paintseed = itemData.paintseed || 0

        // delete unused
        delete itemData.itemid
        delete itemData.inventory
        delete itemData.accountid

        itemData.stickers = itemData.stickers || []
        // prettier-ignore
        itemData.stickers = itemData.stickers.map((sticker) => ({
          ...sticker, wear: sticker.wear || 1,
        }))

        this.resolve(itemData)
        this.resolve = false
        this.currentRequest = false

        setTimeout(() => {
          // We're no longer busy (satisfied request delay)
          this.busy = false
        }, delay)
      }
    })

    this.csgoClient.on('connectedToGC', () => {
      logger.info(`${this.username} CSGO Client Ready!`)
      this.ready = true
    })

    this.csgoClient.on('disconnectedFromGC', (reason) => {
      logger.warn(`${this.username} CSGO unready (${reason}), trying to reconnect!`)
      this.ready = false
    })

    this.csgoClient.on('connectionStatus', (status) => {
      logger.debug(`${this.username} GC Connection Status Update ${status}`)
    })
  }

  sendFloatRequest(link) {
    return new Promise((resolve, reject) => {
      // check bot status
      if (!this.ready || this.busy) {
        reject(new Error('This bot is not ready or busy'))
      }

      this.resolve = resolve
      this.busy = true

      const params = link.getParams()

      logger.debug(`${this.username} Fetching for ${params.a}`)

      this.currentRequest = {
        time: new Date().getTime(),
        s: params.s,
        a: params.a,
        d: params.d,
        m: params.m,
      }

      // The first param (owner) depends on the type of inspect link
      this.csgoClient.inspectItem(params.s !== '0' ? params.s : params.m, params.a, params.d)

      this.ttlTimeout = setTimeout(() => {
        // GC didn't respond in time, reset and reject
        this.busy = false
        this.currentRequest = false
        reject(new Error('ttl exceeded'))
      }, 2000)
    })
  }
}
