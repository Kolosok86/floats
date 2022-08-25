import fs from 'fs'

function get(path) {
  return fs.readFileSync(path, 'UTF-8')
}

export const databases = get('./queries/databases.sql')
export const item = get('./queries/item.sql')
export const price = get('./queries/price.sql')
export const rank = get('./queries/rank.sql')
