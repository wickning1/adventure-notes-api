import { Context, mongo, ConcurrencyError } from '../lib'
import { ObjectId } from 'mongodb'

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

  async get (id: ObjectId, dlname: string) {
    return this.ctx.dataLoaderFactory.get(dlname).load(id)
  }

  async update (info: any, coll: string, dlname?: string) {
    const { id, _version, ...updatedoc } = info
    const result = await mongo.db.collection(coll).updateOne({ _id: id, _version: _version }, {
      $set: updatedoc,
      $inc: { _version: 1 }
    })
    if (!result.matchedCount) throw new ConcurrencyError()
    return this.get(info.id, dlname || coll)
  }
}
