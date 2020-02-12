import { BaseService } from './baseservice'
import { AdventureUpdate, Adventure } from '../models'
import { mongo, Context } from '../lib'
import { ObjectId } from 'mongodb'
import { DataLoaderFactory } from 'dataloader-factory'

DataLoaderFactory.register('adventures', {
  fetch: async (ids: ObjectId[]) => {
    return mongo.db.collection('users').find({ _id: { $in: ids } }).toArray()
  }
})

export class AdventureService extends BaseService<Adventure> {
  constructor (ctx: Context) {
    super(ctx, 'adventures', Adventure)
  }

  async update (info: AdventureUpdate): Promise<Adventure> {
    return super.update(info)
  }
}
