const ms = require('ms')
const https = require('https')
const fs = require('fs')

function setIntervalCustom(_callback, _delay) {
  if (typeof _delay === 'string') {
    _delay = ms(_delay)
  }

  _callback()
  return setInterval(_callback, _delay)
}

function isValidDir(path) {
  try {
    return fs.statSync(path).isDirectory()
  } catch (e) {
    return false
  }
}

function isOnlyDigits(num) {
  return /^\d+$/.test(num)
}

function downloadFile(url, cb) {
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

function unsigned64ToSigned(num) {
  const mask = 1n << 63n
  return (BigInt(num) ^ mask) - mask
}

function signed64ToUnsigned(num) {
  const mask = 1n << 63n
  return (BigInt(num) + mask) ^ mask
}

function isSteamId64(id) {
  id = BigInt(id)
  const universe = id >> 56n
  if (universe > 5n) return false

  const instance = (id >> 32n) & ((1n << 20n) - 1n)

  // There are currently no documented instances above 4, but this is for good measure
  return instance <= 32n
}

function removeNullValues(obj) {
  return Object.keys(obj).reduce((result, key) => {
    if (key in obj && obj[key] !== null) {
      result[key] = obj[key]
    }

    return result
  }, {})
}

function getFloat(data) {
  const buf = Buffer.alloc(4)
  buf.writeFloatBE(data, 0)
  return buf.readInt32BE(0)
}

function readFloat(data) {
  const buf = Buffer.alloc(4)
  buf.writeInt32BE(data, 0)
  return buf.readFloatBE(0)
}

function canSubmitPrice(link, price) {
  return price && link.isMarketLink() && isOnlyDigits(price)
}

function respond(ctx, data, status = 200) {
  ctx.status = status
  ctx.body = data
}

function ctxError(ctx, error) {
  respond(ctx, error.getJSON(), error.statusCode)
}

module.exports = {
  setIntervalCustom,
  downloadFile,
  isValidDir,
  isOnlyDigits,
  canSubmitPrice,
  unsigned64ToSigned,
  signed64ToUnsigned,
  removeNullValues,
  isSteamId64,
  getFloat,
  readFloat,
  respond,
  ctxError,
}
