import * as opts from "./options.js";
import convert from 'koa-convert';
import logger from "koa-logger";
import ratelimit from "koa-ratelimit";
import helmet from "koa-helmet";

const middlewares = [logger(opts.log), ratelimit(opts.ratelimit), helmet(opts.helmet)]

export default () => convert.compose(middlewares)
