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

export function removeNullValues(obj) {
  return Object.keys(obj).reduce((result, key) => {
    if (key in obj && obj[key] !== null) {
      result[key] = obj[key]
    }

    return result
  }, {})
}

export function getRandomVariance() {
  return parseInt(Math.random() * 4 * 60 * 1000)
}
