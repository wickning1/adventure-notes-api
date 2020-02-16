import { Context, mongo, ConcurrencyError, toArray, toClass, AdventureNotChosenError, UnauthenticatedError } from '../lib'
import { ObjectId, IndexOptions } from 'mongodb'
import { ClassType, UnauthorizedError } from 'type-graphql'
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
      fetch: async (ids: ObjectId[], ctx: Context) => {
        const authfilter = await this.authfilters(ctx)
        return this.toModel<any>(await mongo.db.collection(this.dlname).find({ ...authfilter, _id: { $in: ids } }).toArray())
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

  async cleanse (item: T): Promise<T|undefined> {
    // to be implemented by subclasses
    return item
  }

  static async authfilters (ctx: Context, authfilterarray: any[] = []) {
    if (!ctx.user) throw new UnauthenticatedError()
    if (ctx.superadmin || !authfilterarray.length) return {}
    else return { $and: authfilterarray }
  }

  async translatefilters (graphqlfilter: any = {}) {
    // to be further implemented by subclasses
    const mongofilter: any = {}
    if (graphqlfilter.ids) {
      mongofilter._id = { $in: graphqlfilter.ids }
    }
    const authfilters = await (this.constructor as typeof BaseService).authfilters(this.ctx)
    return { ...mongofilter, ...authfilters }
  }

  async process (items: any[]): Promise<T[]>
  async process (items: any): Promise<T | undefined>
  async process (items: any): Promise<any> {
    const models = (this.constructor as typeof BaseService).toModel<T>(toArray(items))
    const ret = (await Promise.all(models.map(this.cleanse.bind(this)))).filter(Boolean)
    if (Array.isArray(items)) return ret
    else return ret[0]
  }

  async get (id?: ObjectId) {
    if (!id) return undefined
    return this.process(await this.ctx.dataLoaderFactory.get(this.dlname).load(id))
  }

  async getMany (ids: ObjectId[]) {
    if (!ids || !ids.length) return []
    return (await Promise.all(ids.map(id => this.get(id)))).filter(Boolean) as T[]
  }

  async getFiltered (filter: any = {}) {
    const finalfilter = await this.translatefilters(filter)
    return this.process(await (this.constructor as typeof BaseService).find(finalfilter))
  }

  async getOneToMany <KeyType> (registeredname: string, key: KeyType, filter: any = {}) {
    const finalfilter = await this.translatefilters(filter)
    const dl = this.ctx.dataLoaderFactory.getOneToMany(registeredname, finalfilter)
    return this.process(await dl.load(key))
  }

  async getManyToMany <KeyType> (registeredname: string, key: KeyType, filter: any = {}) {
    const finalfilter = await this.translatefilters(filter)
    const dl = this.ctx.dataLoaderFactory.getManyToMany(registeredname, finalfilter)
    return this.process(await dl.load(key))
  }

  async create (info: any) {
    const updatedoc = { ...info, _version: 0 }
    const insertId = (await mongo.db.collection(this.dlname).insertOne(updatedoc)).insertedId
    return this.process({ ...updatedoc, _id: insertId })
  }

  async update (id: ObjectId, updatedoc: any, search: any = {}) {
    const authfilter = await (this.constructor as typeof BaseService).authfilters(this.ctx)
    const result = await mongo.db.collection(this.dlname).updateOne({ ...search, ...authfilter, _id: id }, updatedoc)
    const ret = await this.get(id)
    if (!ret) throw new UserInputError('Tried to edit a record that does not exist.')
    if (!result.matchedCount) {
      if ((ret as any)._version && search._version && (ret as any)._version !== search._version) throw new ConcurrencyError()
      else throw new UnauthorizedError()
    }
    return ret
  }

  async updateMany (updatedoc: any, search: any = {}) {
    const authfilter = await (this.constructor as typeof BaseService).authfilters(this.ctx)
    const result = await mongo.db.collection(this.dlname).updateMany({ ...search, ...authfilter }, updatedoc)
    return result.result.ok === 1
  }

  async save (info: any) {
    const { id, _version, ...updatedoc } = info
    const search: any = {}
    if (_version) search._version = _version
    return this.update(id, { $set: updatedoc, $inc: { _version: 1 } }, search)
  }

  static async createIndex (column: any, options: IndexOptions = {}) {
    return mongo.db.collection(this.dlname).createIndex(column, options)
  }
}

export class BelongsToAdventureService<T extends { adventure: ObjectId }> extends BaseService<T> {
  static onStartup (callback?: () => Promise<void>) {
    super.onStartup(callback)
    startups.push(async () => {
      await this.createIndex('adventure')
    })
  }

  static async authfilters (ctx: Context, authfilterarray: any[] = []) {
    if (!ctx.adventure) throw new AdventureNotChosenError()
    const authfilter: any = { adventure: ctx.adventure }
    authfilterarray.push(authfilter)
    return super.authfilters(ctx, authfilterarray)
  }

  async create (info: any) {
    if (!this.ctx.adventure) throw new AdventureNotChosenError()
    return super.create({ ...info, adventure: this.ctx.adventure })
  }
}

export class KnownByService<T extends { knownby: ObjectId[], adventure: ObjectId }> extends BelongsToAdventureService<T> {
  static onStartup (callback?: () => Promise<void>) {
    super.onStartup(callback)
    startups.push(async () => {
      await this.createIndex('knownby')
    })
  }

  static async authfilters (ctx: Context, authfilterarray: any[] = []) {
    const authfilter: any = {}
    if (ctx.character) authfilter.knownby = ctx.character
    authfilterarray.push(authfilter)
    return super.authfilters(ctx, authfilterarray)
  }

  async create (info: any) {
    return super.create({ ...info, knownby: this.ctx.character ? [this.ctx.character] : [] })
  }

  async addKnownBy (ids: ObjectId[], characterIds: ObjectId[]) {
    const cleanCharacterIds = await this.ctx.characterService.getMany(characterIds)
    return super.updateMany({ $addToSet: { knownby: cleanCharacterIds.map(c => c.id) } }, { _id: { $in: ids } })
  }
}
