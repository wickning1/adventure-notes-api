import { BaseService } from './baseservice'
import { AdventureUpdate, Adventure, AdventureDetails, AdventureFilter } from '../models'
import { ObjectId } from 'mongodb'
import { DataLoaderFactory } from 'dataloader-factory'
import { NotFoundError, Context } from '../lib'
import { ForbiddenError } from 'type-graphql'

DataLoaderFactory.registerOneToMany<ObjectId, Adventure>('adventureByDmId', {
  fetch: async (ids, filters) => {
    return AdventureService.find({ ...filters, gamemasters: ids })
  },
  extractKey: adventure => adventure.gamemaster,
  idLoaderKey: 'adventures'
})

export class AdventureService extends BaseService<Adventure> {
  static get dlname () { return 'adventures' }
  static get ModelClass () { return Adventure }

  static async authfilters (ctx: Context) {
    // in order to see an adventure, you need to have a character in the adventure
    // or be the gamemaster
    const characters = await ctx.characterService.getByPlayerId(ctx.user!)
    const mongofilter = {
      $or: [
        { gamemaster: ctx.user },
        { _id: characters.map(c => c.adventure) }
      ]
    }
    return super.authfilters(ctx, [mongofilter])
  }

  async translatefilters (filter: AdventureFilter) {
    const ret = await super.translatefilters(filter)
    if (filter.gamemasters) ret.gamemaster = { $in: filter.gamemasters }
    return ret
  }

  async getByGmId (id: ObjectId, filter?: AdventureFilter) {
    return this.getOneToMany('adventureByDmId', id, filter)
  }

  async create (info: AdventureDetails) {
    return super.create({ ...info, gamemaster: this.ctx.user, day: 0 })
  }

  async save (info: AdventureUpdate): Promise<Adventure> {
    const adventure = await this.get(info.id)
    if (!adventure) throw new NotFoundError()
    if (this.ctx.user !== adventure.gamemaster) throw new ForbiddenError()
    return super.save(info)
  }
}

AdventureService.onStartup(async () => {
  await AdventureService.createIndex('name', { unique: true })
  await AdventureService.createIndex('gamemaster')
})
