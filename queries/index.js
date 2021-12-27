const fs = require('fs')

function get(path) {
  return fs.readFileSync(path, 'UTF-8')
}

module.exports = {
  databases: get('./queries/databases.sql'),
  item: get('./queries/item.sql'),
  price: get('./queries/price.sql'),
  rank: get('./queries/rank.sql'),
}
