import { handleFloatReq } from '../controller/index.js'
import Router from 'koa-router'
import pkg from 'koa-convert'

const { compose } = pkg

const router = new Router({
  prefix: '/api/float',
})

router.get('/', (ctx, next) => {
  return handleFloatReq(ctx, next)
})

export default () => compose([router.allowedMethods(), router.routes()])
