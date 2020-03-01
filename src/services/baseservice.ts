/* eslint-disable no-use-before-define */
import { ObjectId, IndexOptions } from 'mongodb'
import { ClassType } from 'type-graphql'
import { DataLoaderFactory } from 'dataloader-factory'
import { Required } from 'utility-types'
import { Context, mongo, ConcurrencyError, toClass, UnauthenticatedError, startup, NotFoundError, andFilters, onlyResolveId, NotAuthorizedError } from '../lib'
import { GraphQLResolveInfo } from 'graphql'

export interface BasicModel {
  _id: ObjectId
  _version: number
}

export abstract class BaseService<T extends BasicModel = any> {
  public static get dlname (): string { throw new Error('BaseService.dlname was called, must be overridden by subclass') }
  public static get ModelClass (): ClassType { throw new Error('BaseService.ModelClass was called, must be overridden by subclass') }

  public get dlname () { return (this.constructor as typeof BaseService).dlname }
  public get ModelClass () { return (this.constructor as typeof BaseService).ModelClass }

  private static mixinHelpers: (typeof ServiceMixinHelper)[] = []
  private static mixinHelpersWithAuthfilters: Required<(typeof ServiceMixinHelper), 'authfilters'>[] = []
  private mixinHelpers: ServiceMixinHelper[] = []
  private mixinHelpersWithFilters: Required<ServiceMixinHelper, 'filters'>[] = []
  private mixinHelpersWithCleanse: Required<ServiceMixinHelper, 'cleanse'>[] = []
  private mixinHelpersWithPresave: Required<ServiceMixinHelper, 'presave'>[] = []

  public ctx: Context
  constructor (ctx: Context) {
    this.ctx = ctx
    for (const MixinHelper of (this.constructor as typeof BaseService).mixinHelpers) {
      const helper = new MixinHelper(ctx)
      this.mixinHelpers.push(helper)
      if (helper.filters) this.mixinHelpersWithFilters.push(helper as Required<ServiceMixinHelper, 'filters'>)
      if (helper.cleanse) this.mixinHelpersWithCleanse.push(helper as Required<ServiceMixinHelper, 'cleanse'>)
      if (helper.presave) this.mixinHelpersWithPresave.push(helper as Required<ServiceMixinHelper, 'presave'>)
    }
  }

  static setHelpers (...mixinHelpers:(typeof ServiceMixinHelper)[]) {
    this.mixinHelpers = mixinHelpers
    this.mixinHelpersWithAuthfilters = mixinHelpers.filter(t => t.authfilters) as Required<typeof ServiceMixinHelper, 'authfilters'>[]
  }

  static onStartup (callback?: () => Promise<void>) {
    DataLoaderFactory.register(this.dlname, {
      fetch: async (ids: ObjectId[], ctx: Context) => {
        const authfilters = await this.authfilters(ctx)
        return this.find({ ...andFilters(authfilters), _id: { $in: ids } })
      }
    })
    DataLoaderFactory.register(this.dlname + '_unauthenticated', {
      fetch: async (ids: ObjectId[], ctx: Context) => {
        return this.find({ _id: { $in: ids } })
      }
    })
    for (const Helper of this.mixinHelpers) {
      if (Helper.onStartup) startup.addTask(async () => Helper.onStartup!(this))
    }

    if (callback) startup.addTask(callback)
  }

  public static async find<T = any> (filter: any = {}) {
    return this.toModel<T>(await mongo.db.collection(this.dlname).find(filter).toArray())
  }

  // convenience method for calling the static find function from an instance
  protected async find (filter: any) {
    return (this.constructor as typeof BaseService).find<T>(filter)
  }

  private static toModel<T> (items: any[]): T[] {
    return toClass(items, this.ModelClass)
  }

  protected toModel (info: any) {
    return (this.constructor as typeof BaseService).toModel<T>([info])[0]
  }

  // gives services the option to add authorization based filtering before
  // regular queries. the 'find' function skips this, but all the 'get*',
  // 'create', 'update*', 'save' functions respect it
  // overrides MUST call super and should do it at the beginning of their own logic
  protected static async authfilters (ctx: Context, graphqlfilter: any = {}): Promise<any[]> {
    if (!ctx.user) throw new UnauthenticatedError()
    if (ctx.superadmin) return []
    return (await Promise.all(this.mixinHelpersWithAuthfilters.map(Helper => Helper.authfilters(ctx, graphqlfilter)))).flat()
  }

  protected async cleanse (item: T): Promise<T|undefined> {
    if (!item) return item
    for (const helper of this.mixinHelpersWithCleanse) {
      await helper.cleanse(item)
    }
    return item
  }

  protected async cleanseAll (items: T[]): Promise<T[]> {
    return (await Promise.all(items.map(this.cleanse.bind(this)))).filter(Boolean) as T[]
  }

  // provided by services to translate the graphql filter input (e.g. UserFilter)
  // into a mongodb query filter
  // BaseService.translatefilters also triggers 'authfilters' to make sure that
  // part gets done
  // do NOT place an $and at the top level as 'authfilters' will place all of its logic
  // inside that and we don't want a conflict
  // overrides should call super before their own logic
  protected async filters (graphqlfilter: any = {}) {
    const authfilters = await (this.constructor as typeof BaseService).authfilters(this.ctx, graphqlfilter)
    const graphqlfilters = (await Promise.all(this.mixinHelpersWithFilters.map(helper => helper.filters!(graphqlfilter)))).flat()
    return authfilters.concat(graphqlfilters)
  }

  async get (id?: ObjectId, info?: GraphQLResolveInfo) {
    if (!id) return undefined
    if (onlyResolveId(info)) return this.toModel({ _id: id })
    return this.cleanse(await this.ctx.dataLoaderFactory.get(this.dlname).load(id))
  }

  async getUnauthenticated (id: ObjectId): Promise<T|undefined> {
    return this.ctx.dataLoaderFactory.get(this.dlname + '_unauthenticated').load(id)
  }

  async getMany (ids: ObjectId[], info?: GraphQLResolveInfo) {
    if (!ids || !ids.length) return []
    return (await Promise.all(ids.map(id => this.get(id, info)))).filter(Boolean) as T[]
  }

  async getFiltered (graphqlfilter: any = {}) {
    const finalfilters = await this.filters(graphqlfilter)
    return this.cleanseAll(await this.find(andFilters(finalfilters)))
  }

  async getOneToMany <KeyType> (registeredname: string, key: KeyType, graphqlfilter: any = {}) {
    const finalfilters = await this.filters(graphqlfilter)
    const dl = this.ctx.dataLoaderFactory.getOneToMany(registeredname, andFilters(finalfilters))
    return this.cleanseAll(await dl.load(key))
  }

  async getManyToMany <KeyType> (registeredname: string, key: KeyType, graphqlfilter: any = {}) {
    const finalfilters = await this.filters(graphqlfilter)
    const dl = this.ctx.dataLoaderFactory.getManyToMany(registeredname, andFilters(finalfilters))
    return this.cleanseAll(await dl.load(key))
  }

  async create (item: any) {
    const actualitem = this.toModel(item)
    for (const helper of this.mixinHelpersWithPresave) await helper.presave(actualitem)
    const updatedoc = { ...actualitem, _version: 0 }
    actualitem._id = (await mongo.db.collection(this.dlname).insertOne(updatedoc)).insertedId
    return actualitem
  }

  async save (info: any) {
    const { id, _version, ...updatedoc } = info
    const actualitem = (await this.find({ _id: id }))?.[0]
    if (!actualitem) throw new NotFoundError()
    Object.assign(actualitem, updatedoc)
    for (const helper of this.mixinHelpersWithPresave) await helper.presave(actualitem)
    const search = { _version: _version || actualitem._version }
    actualitem._version += 1
    return this.update(id, { $set: actualitem }, search)
  }

  async update (id: ObjectId, updatedoc: any, search: any = {}) {
    const authfilters = await (this.constructor as typeof BaseService).authfilters(this.ctx)
    const result = await mongo.db.collection(this.dlname).updateOne({ ...search, ...andFilters(authfilters), _id: id }, updatedoc)
    const ret = await this.get(id)
    if (!ret) throw new NotFoundError()
    if (!result.matchedCount) {
      if ((ret as any)._version && search._version && (ret as any)._version !== search._version) throw new ConcurrencyError()
      else throw new NotAuthorizedError()
    }
    return ret
  }

  async updateMany (updatedoc: any, search: any = {}) {
    const authfilters = await (this.constructor as typeof BaseService).authfilters(this.ctx)
    const result = await mongo.db.collection(this.dlname).updateMany({ ...search, ...andFilters(authfilters) }, updatedoc)
    return result.result.ok === 1
  }

  static async createIndex (column: any, options: IndexOptions = {}) {
    return mongo.db.collection(this.dlname).createIndex(column, options)
  }
}

export class ServiceMixinHelper<ModelType = any> {
  protected ctx: Context
  constructor (ctx: Context) {
    this.ctx = ctx
  }

  static authfilters? (ctx: Context, graphqlfilter: any): Promise<any[]>
  static onStartup? <T extends typeof BaseService> (Service: T): Promise<void>

  cleanse? (item: ModelType): Promise<void>
  filters? (graphqlfilter: any): Promise<any[]>
  presave? (item: ModelType): Promise<void>
}

export class BaseServiceMixin<M extends BasicModel> {
  protected service: BaseService<M>
  constructor (service: BaseService<M>) {
    this.service = service
  }
}
