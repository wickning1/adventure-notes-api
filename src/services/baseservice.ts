import { Context } from '../lib'

export class BaseService {
  protected ctx: Context
  constructor (ctx: Context) {
    this.ctx = ctx
  }
}
