import { BaseService } from './baseservice'
import { AdventureUpdate, Adventure, AdventureDetails } from '../models'
import { ObjectId } from 'mongodb'
import { DataLoaderFactory } from 'dataloader-factory'

DataLoaderFactory.registerOneToMany<ObjectId, Adventure>('adventureByDmId', {
  fetch: async (ids, filters) => {
    return AdventureService.find<Adventure>({ ...filters, dm: ids })
  },
  extractKey: adventure => adventure.dm
})

export class AdventureService extends BaseService<Adventure> {
  static get dlname (): string { return 'adventures' }
  static get ModelClass () { return Adventure }

  translatefilters (filter: any) {
    const ret = super.translatefilters(filter)
    if (filter.dm) ret.dm = { $in: filter.dm }
    return ret
  }

  async getByDmId (id: ObjectId) {
    return this.ctx.dataLoaderFactory.getOneToMany<ObjectId, Adventure>('adventureByDmId').load(id)
  }

  async create (info: AdventureDetails) {
    return super.create(info)
  }

  async update (info: AdventureUpdate): Promise<Adventure> {
    return super.update(info)
  }
}

AdventureService.onStartup(async () => {
  AdventureService.createIndex('dm')
})
