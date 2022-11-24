export function getBoom(msg) {
  return { message: msg || 'Internal Server error' }
}

export function throwError(ctx, error) {
  const payload = getBoom(error?.msg)
  ctx.status = error?.status || 500

  ctx.body = payload
}
