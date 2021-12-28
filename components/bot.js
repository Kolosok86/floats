const SteamUser = require('steam-user')
const GlobalOffensive = require('globaloffensive')
const logger = require('../services/logger')
const SteamTotp = require('steam-totp')
const ms = require('ms')

class Bot {
  constructor(loginData) {
    this.ready = false
    this.busy = false

    this.username = loginData.user
    this.password = loginData.pass
    this.auth = loginData.auth

    this.steamClient = new SteamUser()
    this.csgoClient = new GlobalOffensive(this.steamClient)

    const variance = parseInt(Math.random() * 4 * 60 * 1000)

    setInterval(() => {
      this.csgoClient.refreshSession()
    }, 45 * 60000 + variance)

    this.bindEventHandlers()
    this.logIn()
  }

  logIn() {
    logger.info(`Logging in ${this.username}`)

    logger.debug(`${this.username} Generating TOTP Code from shared_secret`)
    let code = SteamTotp.getAuthCode(this.auth)

    let loginData = {
      accountName: this.username,
      password: this.password,
      twoFactorCode: code,
    }

    logger.debug(`${this.username} About to connect`)

    this.steamClient.logOn(loginData)
  }

  addGame() {
    this.steamClient.requestFreeLicense([730], (err, grantedPackages, grantedAppIDs) => {
      logger.debug(`${this.username} Granted Packages`, grantedPackages)
      logger.debug(`${this.username} Granted App IDs`, grantedAppIDs)

      if (err) {
        logger.error(`${this.username} Failed to obtain free CS:GO license`)
      } else {
        this.steamClient.gamesPlayed([730], true)
      }
    })
  }

  bindEventHandlers() {
    this.steamClient.on('error', (err) => {
      logger.error(`Error logging in ${this.username}:`, err)

      setTimeout(() => {
        if (!this.steamClient.steamID) this.logIn()
      }, ms('2h'))
    })

    this.steamClient.on('disconnected', (eresult, msg) => {
      logger.warn(`${this.username} Logged off, reconnecting! (${eresult}, ${msg})`)
    })

    this.steamClient.on('loggedOn', () => {
      logger.info(`${this.username} Log on OK`)

      this.steamClient.gamesPlayed([], true)

      setTimeout(() => {
        this.steamClient.gamesPlayed([730], true)
      }, 2500)
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

        // paintwear -> floatvalue to match previous API version response
        itemData.floatvalue = itemData.paintwear
        
        // delete unused
        delete itemData.paintwear
        delete itemData.itemid
        delete itemData.inventory

        // Backwards compatibility with previous node-globaloffensive versions
        for (const sticker of itemData.stickers) {
          sticker.stickerId = sticker.sticker_id
          delete sticker.sticker_id
        }

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

    this.csgoClient.on('debug', (msg) => {
      logger.debug(msg)
    })
  }

  sendFloatRequest(link) {
    return new Promise((resolve, reject) => {
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

      if (!this.ready) {
        reject(new Error('This bot is not ready'))
      } else {
        // The first param (owner) depends on the type of inspect link
        this.csgoClient.inspectItem(params.s !== '0' ? params.s : params.m, params.a, params.d)
      }

      this.ttlTimeout = setTimeout(() => {
        // GC didn't respond in time, reset and reject
        this.busy = false
        this.currentRequest = false
        reject(new Error('ttl exceeded'))
      }, 2000)
    })
  }
}

module.exports = {
  Bot,
}
