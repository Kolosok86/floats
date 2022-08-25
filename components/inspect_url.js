import { isOnlyDigits } from '../services/utils.js'

export class InspectURL {
  constructor(url) {
    this.requiredParams = ['s', 'a', 'd', 'm']

    if (typeof url === 'string') {
      this.parseLink(url)
    }
  }

  get valid() {
    for (let param of this.requiredParams) {
      if (!this[param] || !isOnlyDigits(this[param])) return false
    }

    return true
  }

  parseLink(link) {
    try {
      link = decodeURI(link)
    } catch (e) {
      return
    }

    let groups =
      /^steam:\/\/rungame\/730\/\d+\/[+ ]csgo_econ_action_preview ([SM])(\d+)A(\d+)D(\d+)$/.exec(
        link
      )

    if (groups) {
      if (groups[1] === 'S') {
        this.s = groups[2]
        this.m = '0'
      } else if (groups[1] === 'M') {
        this.m = groups[2]
        this.s = '0'
      }

      this.a = groups[3]
      this.d = groups[4]
    }
  }

  getParams() {
    if (this.valid) return { s: this.s, a: this.a, d: this.d, m: this.m }
  }

  isMarketLink() {
    return this.valid && this.m !== '0'
  }
}
