const bots = require('../constants/bots.json')
const { default: PQueue } = require('p-queue')
const pRetry = require('p-retry')
const errors = require('./errors')
const { Bot } = require('./bot')

class BotController {
  constructor() {
    this.bots = []

    const queue = new PQueue({
      concurrency: 1,
      intervalCap: 1,
      interval: 1500,
    })

    for (let bot of bots) {
      queue.add(() => {
        this.addBot(bot)
      })
    }
  }

  addBot(loginData) {
    this.bots.push(new Bot(loginData))
  }

  getFreeBot() {
    for (let bot of this.bots) {
      if (!bot.busy && bot.ready) return bot
    }

    return false
  }

  hasBotOnline() {
    for (let bot of this.bots) {
      if (bot.ready) return true
    }

    return false
  }

  executeJob(data) {
    return pRetry(() => this.lookupFloat(data), {
      minTimeout: 0,
      retries: 3,
    })
  }

  lookupFloat(data) {
    let freeBot = this.getFreeBot()

    if (freeBot) return freeBot.sendFloatRequest(data)
    else return Promise.reject(errors.NoBotsAvailable)
  }
}

module.exports = {
  BotController,
}
