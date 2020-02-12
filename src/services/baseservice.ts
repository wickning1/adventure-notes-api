import { Context, mongo, ConcurrencyError, toArray, toClass } from '../lib'
import { ObjectId } from 'mongodb'
import { ClassType } from 'type-graphql'
import { UserInputError } from 'apollo-server'

export abstract class BaseService<T> {
  protected ctx: Context
  protected dlname: string
  protected ModelClass: ClassType
  constructor (ctx: Context, dlname: string, ModelClass: ClassType) {
    this.ctx = ctx
    this.dlname = dlname
    this.ModelClass = ModelClass
  }

  private static startups: (() => Promise<void>)[] = []
  static onStartup (callback: () => Promise<void>) {
    BaseService.startups.push(callback)
  }

  static async start () {
    await Promise.all(BaseService.startups.map(s => s()))
  }

  cleanse (item: any) {
    // to be implemented by subclasses
    return item
  }

  toModel (items: any[]): T[]
  toModel (items: any): T | undefined
  toModel (items: any) {
    let ret = toArray(items)
    if (this.cleanse) ret = ret.map(this.cleanse.bind(this))
    if (Array.isArray(items)) return toClass(ret, this.ModelClass)
    else return toClass(ret[0], this.ModelClass)
  }

  async get (id: ObjectId) {
    return this.toModel(this.ctx.dataLoaderFactory.get(this.dlname).load(id))
  }

  async getMany (ids: ObjectId[]) {
    return Promise.all(ids.map(id => this.get(id)))
  }

  async find (filter: any = {}) {
    const items = await mongo.db.collection(this.dlname).find(filter).toArray()
    return this.toModel(items)
  }

  async create (info: any) {
    const updatedoc = { ...info, _version: 0 }
    const insertId = (await mongo.db.collection(this.dlname).insertOne(updatedoc)).insertedId
    return this.toModel({ ...updatedoc, _id: insertId })
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
}
