import { handleFloatReq, getStats } from '../controller/index.js'
import Router from 'koa-router'
import pkg from 'koa-convert'

const { compose } = pkg

const router = new Router({
  prefix: '/api/float',
})

router.get('/', (ctx, next) => handleFloatReq(ctx, next))
router.get('/stats', (ctx, next) => getStats(ctx, next))

export default () => compose([router.allowedMethods(), router.routes()])
