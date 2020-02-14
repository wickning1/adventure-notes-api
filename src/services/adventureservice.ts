import { BaseService } from './baseservice'
import { AdventureUpdate, Adventure, AdventureDetails } from '../models'
import { ObjectId } from 'mongodb'
import { DataLoaderFactory } from 'dataloader-factory'

DataLoaderFactory.registerOneToMany<ObjectId, Adventure>('adventureByDmId', {
  fetch: async (ids, filters) => {
    return AdventureService.find<Adventure>({ ...filters, gamemasters: ids })
  },
  extractKey: adventure => adventure.gamemaster
})

export class AdventureService extends BaseService<Adventure> {
  static get dlname () { return 'adventures' }
  static get ModelClass () { return Adventure }

  translatefilters (filter: any) {
    const ret = super.translatefilters(filter)
    if (filter.gamemasters) ret.gamemaster = { $in: filter.gamemasters }
    return ret
  }

  async getByDmId (id: ObjectId) {
    return this.ctx.dataLoaderFactory.getOneToMany<ObjectId, Adventure>('adventureByDmId').load(id)
  }

  async create (info: AdventureDetails) {
    return super.create({ ...info, gamemaster: this.ctx.user, day: 0 })
  }

  async update (info: AdventureUpdate): Promise<Adventure> {
    return super.update(info)
  }
}

AdventureService.onStartup(async () => {
  await AdventureService.createIndex('name', { unique: true })
  await AdventureService.createIndex('gamemaster')
})
