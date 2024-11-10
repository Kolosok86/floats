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

    const opts = {
      protocol: SteamUser.EConnectionProtocol.TCP,
    }

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
    this.timeStep = ms('25m') + variance

    this.bindEventHandlers()
  }

  logIn() {
    if (this.exit) return

    this.gracefulExit()

    const loginData = {
      twoFactorCode: SteamTotp.getAuthCode(this.auth),
      accountName: this.username,
      password: this.password,
    }

    logger.info(`Logging in ${this.username}`)

    this.steamClient.logOn(loginData)
  }

  gracefulExit() {
    if (this.steamClient) this.steamClient.logOff()
  }

  setLastLogin() {
    this.time = Date.now() + this.timeStep
  }

  refreshSession(force) {
    if (this.exit || !this.ready) return

    if (Date.now() < this.time && !force) {
      return
    }

    this.ready = false

    // execute update
    this.csgoClient.refreshSession()
  }

  getClassInfo(data) {
    return new Promise((resolve, reject) => {
      this.steamClient.getAssetClassInfo('en', 730, data, (err, response) => {
        if (err) return reject(err)
        resolve(response)
      })
    })
  }

  bindEventHandlers() {
    this.steamClient.on('error', (err) => {
      logger.error(`Error logging in ${this.username}:`, err)

      this.ready = false

      // bad proxy auth config
      if (err.toString().includes('Proxy Authentication')) {
        this.gracefulExit()
        this.exit = true
        return
      }

      // something wrong with proxy
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

    this.steamClient.on('disconnected', (result, msg) => {
      logger.warn(`${this.username} Logged off, reconnecting! (${result}, ${msg})`)
      this.ready = false
    })

    this.steamClient.on('loggedOn', () => {
      logger.info(`${this.username} Log on OK`)

      this.steamClient.gamesPlayed([], true)

      setTimeout(() => {
        this.steamClient.gamesPlayed([730], true)
      }, 3000)
    })

    this.csgoClient.on('error', (error) => {
      logger.warn(`${this.username} CSGO responded with error ${error}`)

      this.ready = false

      // attempt reconnect after 5 minute
      setTimeout(() => {
        this.refreshSession(true)
      }, 5 * 60000)
    })

    this.csgoClient.on('connectedToGC', () => {
      logger.info(`${this.username} CSGO Client Ready!`)

      this.setLastLogin()
      this.ready = true
    })

    this.csgoClient.on('disconnectedFromGC', (reason) => {
      logger.warn(`${this.username} CSGO unready (${reason}), trying to reconnect!`)
      this.ready = false
    })

    this.csgoClient.on('connectionStatus', (status) => {
      logger.debug(`${this.username} GC Connection Status Update ${status}`)
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

        itemData.keychains = itemData.keychains || []
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
  }

  sendFloatRequest(link) {
    return new Promise((resolve, reject) => {
      // check bot status
      if (!this.ready || this.busy) {
        reject(new Error('NoBotsAvailable'))
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
        logger.warn(
          `${this.username} | ttl timeout for ${params.a}, ${params.s !== '0' ? params.s : params.m}, ${params.d}`
        )

        // GC didn't respond in time, reset and reject
        this.busy = false
        this.currentRequest = false
        reject(new Error('TTLExceeded'))
      }, 2000)
    })
  }
}
