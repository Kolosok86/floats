import { Bot } from './bot.js'
import pRetry from 'p-retry'
import PQueue from 'p-queue'
import ms from 'ms'

export class Controller {
  constructor() {
    this.bots = []
  }

  runJob(time) {
    if (!this.bots.length) return

    setInterval(() => {
      this.updateSessions()
    }, ms(time))
  }

  updateSessions() {
    for (let bot of this.bots) {
      bot.refreshSession()
    }
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

  getCount() {
    const online = this.bots.filter((e) => e.ready).length
    const total = this.bots.length

    return { online, total }
  }

  lookup(data) {
    let freeBot = this.getFreeBot()

    if (freeBot) return freeBot.sendFloatRequest(data)
    else return Promise.reject('NoBotsAvailable')
  }
}
