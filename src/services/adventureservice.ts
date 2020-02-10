import { BaseService } from './baseservice'
import { AdventureUpdate, Adventure } from '../models'
import { mongo, toArray, toClass } from '../lib'
import { ObjectId } from 'mongodb'
import { DataLoaderFactory } from 'dataloader-factory'

DataLoaderFactory.register('adventures', {
  fetch: async (ids: ObjectId[]) => {
    return mongo.db.collection('users').find({ _id: { $in: ids } }).toArray()
  }
})

export class AdventureService extends BaseService {
  cleanse (adventures: any[]): Adventure[]
  cleanse (adventures: any): Adventure | undefined
  cleanse (adventures: any) {
    const ret = toArray(adventures).map(info => {
      return { ...info }
    })
    if (Array.isArray(adventures)) return toClass(ret, Adventure)
    else return toClass(ret[0], Adventure)
  }

  async get (id: ObjectId) {
    return this.cleanse(await this.ctx.dataLoaderFactory.get('adventures').load(id))
  }

  async update (info: AdventureUpdate): Promise<Adventure> {
    return super.update(info, 'adventures')
  }
}
