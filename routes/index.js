import { handleFloatReq, getHealth, getDescriptions } from '../controllers/index.js'
import Router from 'koa-router'
import pkg from 'koa-convert'

const { compose } = pkg

const router = new Router({
  prefix: '/api/float',
})

router.get('/', (ctx, next) => handleFloatReq(ctx, next))
router.post('/descriptions', (ctx, next) => getDescriptions(ctx, next))
router.get('/health', (ctx, next) => getHealth(ctx, next))

export default () => compose([router.allowedMethods(), router.routes()])
