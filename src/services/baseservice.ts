import { Context } from '../lib'

export abstract class BaseService {
  protected ctx: Context
  constructor (ctx: Context) {
    this.ctx = ctx
  }

  private static startups: (() => Promise<void>)[] = []
  static onStartup (callback: () => Promise<void>) {
    BaseService.startups.push(callback)
  }

  static async start () {
    await Promise.all(BaseService.startups.map(s => s()))
  }
}
