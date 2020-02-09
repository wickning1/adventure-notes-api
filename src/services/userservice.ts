import { MongoID } from '../lib'
import { BaseService } from '.'
import { db } from '../lib/db'

export class UserService extends BaseService {
  async get (id: MongoID) {
    return db.collection('users').findOne({ id })
  }
}
