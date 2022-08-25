import ms from 'ms'
import https from 'https'
import fs from 'fs'

export function setIntervalCustom(_callback, _delay) {
  if (typeof _delay === 'string') {
    _delay = ms(_delay)
  }

  _callback()
  return setInterval(_callback, _delay)
}

export function isValidDir(path) {
  try {
    return fs.statSync(path).isDirectory()
  } catch (e) {
    return false
  }
}

export function isOnlyDigits(num) {
  return /^\d+$/.test(num)
}

export function downloadFile(url, cb) {
  https.get(url, function (res) {
    let errored = false

    if (res.statusCode !== 200 && !errored) {
      cb()
      return
    }

    res.setEncoding('utf8')
    let data = ''

    res.on('error', function () {
      cb()
      errored = true
    })

    res.on('data', function (chunk) {
      data += chunk
    })

    res.on('end', function () {
      cb(data)
    })
  })
}

export function unsigned64ToSigned(num) {
  const mask = 1n << 63n
  return (BigInt(num) ^ mask) - mask
}

export function signed64ToUnsigned(num) {
  const mask = 1n << 63n
  return (BigInt(num) + mask) ^ mask
}

export function isSteamId64(id) {
  id = BigInt(id)
  const universe = id >> 56n
  if (universe > 5n) return false

  const instance = (id >> 32n) & ((1n << 20n) - 1n)

  // There are currently no documented instances above 4, but this is for good measure
  return instance <= 32n
}

export function removeNullValues(obj) {
  return Object.keys(obj).reduce((result, key) => {
    if (key in obj && obj[key] !== null) {
      result[key] = obj[key]
    }

    return result
  }, {})
}

export function getFloat(data) {
  const buf = Buffer.alloc(4)
  buf.writeFloatBE(data, 0)
  return buf.readInt32BE(0)
}

export function readFloat(data) {
  const buf = Buffer.alloc(4)
  buf.writeInt32BE(data, 0)
  return buf.readFloatBE(0)
}

export function canSubmitPrice(link, price) {
  return price && link.isMarketLink() && isOnlyDigits(price)
}

export function respond(ctx, data, status = 200) {
  ctx.status = status
  ctx.body = data
}

export function ctxError(ctx, error) {
  respond(ctx, error, error.status)
}
