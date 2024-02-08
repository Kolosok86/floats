export function getBoom(msg) {
  return { message: msg || 'Internal Server error' }
}

export function throwError(ctx, type) {
  const error = ctx.catcher.getError(type)

  const payload = getBoom(error?.msg)
  ctx.status = error?.status || 500

  ctx.body = payload
}
