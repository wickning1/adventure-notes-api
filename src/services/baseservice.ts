import { Context, mongo, ConcurrencyError, toArray, toClass } from '../lib'
import { ObjectId } from 'mongodb'
import { ClassType } from 'type-graphql'
import { UserInputError } from 'apollo-server'
import { DataLoaderFactory } from 'dataloader-factory'

type InstanceType<T> = T extends { new(...args: any[]): infer I } ? I : never
export function createBaseService<MC extends ClassType, T extends InstanceType<MC>> (dlname: string, ModelClass: MC) {
  DataLoaderFactory.register(dlname, {
    fetch: async (ids: ObjectId[]) => {
      return mongo.db.collection(dlname).find({ _id: { $in: ids } }).toArray()
    }
  })

  class BaseService {
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

    static async find (filter: any = {}) {
      return mongo.db.collection(dlname).find(filter).toArray()
    }

    cleanse (item: any) {
      // to be implemented by subclasses
      return item
    }

    toModel (items: any[]): T[]
    toModel (items: any): T | undefined
    toModel (items: any): any {
      let ret = toArray(items)
      if (this.cleanse) ret = ret.map(this.cleanse.bind(this))
      if (Array.isArray(items)) return toClass(ret, ModelClass)
      else return toClass(ret[0], ModelClass)
    }

    async get (id: ObjectId) {
      return this.toModel(this.ctx.dataLoaderFactory.get(dlname).load(id))
    }

    async getMany (ids: ObjectId[]) {
      return Promise.all(ids.map(id => this.get(id)))
    }

    async create (info: any) {
      const updatedoc = { ...info, _version: 0 }
      const insertId = (await mongo.db.collection(dlname).insertOne(updatedoc)).insertedId
      return this.toModel({ ...updatedoc, _id: insertId })
    }

    async update (info: any) {
      const { id, _version, ...updatedoc } = info
      const result = await mongo.db.collection(dlname).updateOne({ _id: id, _version: _version }, {
        $set: updatedoc,
        $inc: { _version: 1 }
      })
      if (!result.matchedCount) throw new ConcurrencyError()
      const ret = await this.get(info.id)
      if (!ret) throw new UserInputError('Tried to edit a record that does not exist.')
      return ret
    }
  }
  return BaseService
}
