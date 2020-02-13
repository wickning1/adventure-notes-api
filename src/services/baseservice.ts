import { Context, mongo, ConcurrencyError, toArray, toClass } from '../lib'
import { ObjectId, IndexOptions } from 'mongodb'
import { ClassType } from 'type-graphql'
import { UserInputError } from 'apollo-server'
import { DataLoaderFactory } from 'dataloader-factory'

const startups: (() => Promise<void>)[] = []
export async function startServices () {
  await mongo.start()
  await Promise.all(startups.map(s => s()))
}

export class BaseService<T> {
  protected static get dlname (): string { throw new Error('BaseService.dlname was called, must be overridden by subclass') }
  protected static get ModelClass (): ClassType { throw new Error('BaseService.ModelClass was called, must be overridden by subclass') }

  protected get dlname () { return (this.constructor as typeof BaseService).dlname }
  protected get ModelClass () { return (this.constructor as typeof BaseService).ModelClass }

  protected ctx: Context
  constructor (ctx: Context) {
    this.ctx = ctx
  }

  static onStartup (callback?: () => Promise<void>) {
    DataLoaderFactory.register(this.dlname, {
      fetch: async (ids: ObjectId[]) => {
        return mongo.db.collection(this.dlname).find({ _id: { $in: ids } }).toArray()
      }
    })
    if (callback) startups.push(callback)
  }

  static async find<T> (filter: any = {}) {
    return this.toModel<T>(await mongo.db.collection(this.dlname).find(filter).toArray())
  }

  static toModel<T> (items: any[]): T[]
  static toModel<T> (items: any): T | undefined
  static toModel (items: any): any {
    return toClass(items, this.ModelClass)
  }

  cleanse (item: T) {
    // to be implemented by subclasses
    return item
  }

  translatefilters (filter: any) {
    // to be further implemented by subclasses
    const ret: any = {}
    if (filter.ids) {
      ret._id = { $in: filter.ids }
    }
    return ret
  }

  process (items: any[]): T[]
  process (items: any): T | undefined
  process (items: any): any {
    const ret = (this.constructor as typeof BaseService).toModel<T>(toArray(items)).map(this.cleanse.bind(this))
    if (Array.isArray(items)) return ret
    else return ret[0]
  }

  async get (id: ObjectId) {
    return this.process(this.ctx.dataLoaderFactory.get(this.dlname).load(id))
  }

  async getMany (ids: ObjectId[]) {
    return (await Promise.all(ids.map(id => this.get(id)))).filter(Boolean) as T[]
  }

  async getFiltered (filter: any) {
    const finalfilter = this.translatefilters(filter)
    return this.process(await (this.constructor as typeof BaseService).find(finalfilter))
  }

  async create (info: any) {
    const updatedoc = { ...info, _version: 0 }
    const insertId = (await mongo.db.collection(this.dlname).insertOne(updatedoc)).insertedId
    return this.process({ ...updatedoc, _id: insertId })
  }

  async update (info: any) {
    const { id, _version, ...updatedoc } = info
    const result = await mongo.db.collection(this.dlname).updateOne({ _id: id, _version: _version }, {
      $set: updatedoc,
      $inc: { _version: 1 }
    })
    if (!result.matchedCount) throw new ConcurrencyError()
    const ret = await this.get(info.id)
    if (!ret) throw new UserInputError('Tried to edit a record that does not exist.')
    return ret
  }

  static async createIndex (column: any, options: IndexOptions = {}) {
    return mongo.db.collection(this.dlname).createIndex(column, options)
  }
}
