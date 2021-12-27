const logger = require('../services/logger')
const utils = require('../services/utils')
const conf = require('../config')
const queries = require('../queries')
const { Pool } = require('pg')

const POSTGRES_URL = conf.get('postgres')

class Postgres {
  constructor() {
    this.pool = new Pool({
      connectionString: POSTGRES_URL,
    })

    this.pool.connect().then(() => {
      logger.info('Database connected')
      this.executeTables()
    }).catch((err) => {
      logger.error('Error from connect to base, %s', err)
    })
  
    this.insert = []

    setInterval(() => {
      this.updateItems()
    }, 1000)
  }

  executeTables() {
    this.pool.query(queries.databases).then(() => {
      logger.info('Tables created in postgres')
    }).catch((err) => {
      logger.error(err)
    })
  }

  static storeProperties(origin, quality, rarity) {
    return origin | (quality << 8) | (rarity << 16)
  }

  static extractProperties(prop) {
    return {
      origin: prop & ((1 << 8) - 1),
      quality: (prop >> 8) & ((1 << 8) - 1),
      rarity: (prop >> 16) & ((1 << 8) - 1),
    }
  }
  
  static buildQuery(itemCount) {
    const values = []
    let i = 1
    
    // Builds binding pattern such as ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, now(), $12, NULL, $13)
    for (let c = 0; c < itemCount; c++) {
      values.push(`($${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}, $${i++}::jsonb, now(), $${i++}, NULL, $${i++})`)
    }
    
    return `INSERT INTO items (ms, a, d, paintseed, paintwear, defindex, paintindex, stattrak, souvenir, props, stickers, updated, rarity, floatid, price)
                VALUES ${values.join(', ')} ON CONFLICT(defindex, paintindex, paintwear, paintseed) DO UPDATE SET ms=excluded.ms, a=excluded.a, d=excluded.d, stickers=excluded.stickers, updated=now()`
  }
  
  updateItems() {
    if (this.insert.length > 0) {
      const copy = [...this.insert]
      this.insert = []
      this.handleBulkInsert(copy)
    }
  }

  async getItemData(link) {
    const aValue = utils.unsigned64ToSigned(link.getParams().a)
    const result = await this.pool.query(queries.item, [ aValue ])
    
    return result.rows.map((item) => {
      // Correspond to existing API, ensure we can still recreate the full item name
      if (item.stattrak) {
        item.killeatervalue = 0
      } else {
        item.killeatervalue = null
      }

      item.stickers = item.stickers || []
      item.stickers = item.stickers.map((s) => ({
        stickerId: s.i,
        slot: s.s,
        wear: s.w,
      }))

      item = Object.assign(Postgres.extractProperties(item.props), item)
      item.floatvalue = utils.readFloat(item.paintwear)

      item.a = utils.signed64ToUnsigned(item.a).toString()
      item.d = utils.signed64ToUnsigned(item.d).toString()
      item.ms = utils.signed64ToUnsigned(item.ms).toString()

      if (utils.isSteamId64(item.ms)) {
        item.s = item.ms
        item.m = '0'
      } else {
        item.m = item.ms
        item.s = '0'
      }

      item.high_rank = parseInt(item.high_rank)
      item.low_rank = parseInt(item.low_rank)

      // Delete the rank if above 1000 (we don't get ranking above that)
      if (item.high_rank === 1001) {
        delete item.high_rank
      }

      if (item.low_rank === 1001) {
        delete item.low_rank
      }

      delete item.updated
      delete item.souvenir
      delete item.stattrak
      delete item.paintwear
      delete item.ms
      delete item.props
      delete item.price

      return item
    })
  }

  async getItemRank(item) {
    const paintwear = utils.getFloat(item.floatvalue)
    const isStattrak = item.killeatervalue !== null
    const isSouvenir = item.quality === 12
    const paintindex = item.paintindex
    const defindex = item.defindex

    const result = await this.pool.query(queries.rank, [
      paintwear,
      defindex,
      paintindex,
      isStattrak,
      isSouvenir,
    ])

    const obj = {}

    if (!result?.rows?.length) {
      return obj
    }

    const [data] = result.rows

    if (data.high_rank !== 1001) {
      obj.high_rank = parseInt(data.high_rank)
    }

    if (data.low_rank !== 1001) {
      obj.low_rank = parseInt(data.low_rank)
    }

    return obj
  }
  
  async handleBulkInsert(data) {
    const uniqueItems = new Set()
    const values = []
    
    for (let [item, price] of data) {
      item = Object.assign({}, item)
      
      // Store float as int32 to prevent float rounding errors
      // Postgres doesn't support unsigned types, so we use signed here
      item.paintwear = utils.getFloat(item.floatvalue)
      
      if (item.floatvalue <= 0 && item.defindex !== 507) {
        // Only insert weapons, naive check
        // Special case for the 0 float Karambit
        continue
      }
      
      // Postgres doesn't support unsigned 64 bit ints, so we convert them to signed
      item.s = utils.unsigned64ToSigned(item.s).toString()
      item.a = utils.unsigned64ToSigned(item.a).toString()
      item.d = utils.unsigned64ToSigned(item.d).toString()
      item.m = utils.unsigned64ToSigned(item.m).toString()
      
      const stickers =
        item.stickers.length > 0
          ? item.stickers.map((s) => {
            const res = { s: s.slot, i: s.stickerId }
            if (s.wear) {
              res.w = s.wear
            }
            return res
          })
          : null
      
      if (stickers) {
        // Add a property on stickers with duplicates that signifies how many dupes there are
        // Only add this property to one of the dupe stickers in the array
        for (const sticker of stickers) {
          const matching = stickers.filter((s) => s.i === sticker.i)
          if (matching.length > 1 && !matching.find((s) => s.d > 1)) {
            sticker.d = matching.length
          }
        }
      }
      
      const ms = item.s !== '0' ? item.s : item.m
      const isStattrak = item.killeatervalue !== null
      const isSouvenir = item.quality === 12
      
      const props = Postgres.storeProperties(item.origin, item.quality, item.rarity)
      
      price = price || null
      
      // Prevent two of the same item from being inserted in the same statement (causes postgres to get angry)
      const key = `${item.defindex}_${item.paintindex}_${item.paintwear}_${item.paintseed}`
      if (uniqueItems.has(key)) {
        continue
      } else {
        uniqueItems.add(key)
      }
      
      values.push([
        ms,
        item.a,
        item.d,
        item.paintseed,
        item.paintwear,
        item.defindex,
        item.paintindex,
        isStattrak,
        isSouvenir,
        props,
        JSON.stringify(stickers),
        item.rarity,
        price,
      ])
    }
    
    if (values.length === 0) {
      return
    }
    
    try {
      const query = Postgres.buildQuery(values.length)
      await this.pool.query(query, values.flat())
      logger.debug(`Inserted / updated ${values.length} items`)
    } catch (e) {
      logger.warn(e)
    }
  }
  
  insertItemData(item, price) {
    this.insert.push([ item, price ])
  }

  updateItemPrice(assetId, price) {
    this.pool.query(queries.price, [price, assetId])
  }
}

module.exports = {
  Postgres,
}
