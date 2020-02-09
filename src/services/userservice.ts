import { MongoID } from '../lib'
import { User } from '../models'
import { BaseService } from '.'

export class UserService extends BaseService {
  async get (id: MongoID) {
    return new User()
  }
}
