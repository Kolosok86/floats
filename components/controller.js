import * as errors from '../constants/errors.js'
import { Bot } from './bot.js'
import pRetry from 'p-retry'
import PQueue from 'p-queue'

export class Controller {
  constructor() {
    this.bots = []
  }

  addBots(bots) {
    const queue = new PQueue({
      concurrency: 1,
      intervalCap: 1,
      interval: 1500,
    })

    const data = bots.map((e) => () => {
      return this.addBot(e)
    })

    queue.addAll(data)
  }

  async addBot(data) {
    const bot = new Bot(data)
    bot.logIn()

    this.bots.push(bot)
  }

  getFreeBot() {
    const bots = this.bots.filter((bot) => !bot.busy && bot.ready)
    if (!bots.length) return false

    return bots[Math.floor(Math.random() * bots.length)]
  }

  hasBotOnline() {
    for (let bot of this.bots) {
      if (bot.ready) return true
    }

    return false
  }

  execute(data) {
    return pRetry(() => this.lookup(data), {
      minTimeout: 0,
      retries: 3,
    })
  }

  lookup(data) {
    let freeBot = this.getFreeBot()

    if (freeBot) return freeBot.sendFloatRequest(data)
    else return Promise.reject(errors.NoBotsAvailable)
  }
}
