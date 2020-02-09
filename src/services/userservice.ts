import { MongoID, toClass } from '../lib'
import { BaseService } from '.'
import { db } from '../lib/db'
import { DataLoaderFactory } from 'dataloader-factory'
import { User } from '../models'

DataLoaderFactory.register<MongoID, User>('users', {
  fetch: async (ids: MongoID[]) => {
    const users = await db.collection('users').find({ id: ids }).toArray()
    return toClass(users, User)
  }
})

export class UserService extends BaseService {
  async get (id: MongoID) {
    return this.dataLoaderFactory.get<MongoID, User>('users').load(id)
  }
}
