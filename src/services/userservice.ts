import { mongo, toClass, saltAndHash, checkSaltedHash, toArray } from '../lib'
import { BaseService } from '.'
import { DataLoaderFactory } from 'dataloader-factory'
import { User, UserInput, UserUpdate } from '../models'
import { UserInputError } from 'apollo-server'
import { ObjectId } from 'mongodb'

DataLoaderFactory.register('users', {
  fetch: async (ids: ObjectId[]) => {
    return mongo.db.collection('users').find({ _id: { $in: ids } }).toArray()
  }
})

export class UserService extends BaseService {
  cleanse (users: any[]): User[]
  cleanse (users: any): User | undefined
  cleanse (users: any) {
    const ret = toArray(users).map(userData => {
      return { ...userData, email: userData._id.toString() === this.ctx.user ? userData.email : '' }
    })
    if (Array.isArray(users)) return toClass(ret, User)
    else return toClass(ret[0], User)
  }

  async get (id: ObjectId): Promise<User> {
    return super.get(id, 'users')
  }

  async getMany () {
    const users = await mongo.db.collection('users').find().toArray()
    return this.cleanse(users)
  }

  async create (userData: UserInput) {
    if (!userData.password?.length) throw new UserInputError('Password is required.')
    const { hash, salt } = saltAndHash(userData.password)
    const user = { ...userData, password: hash, salt, _version: 0 }
    const insertId = (await mongo.db.collection('users').insertOne(user)).insertedId
    return this.cleanse({ ...user, _id: insertId })
  }

  async update (userData: UserUpdate): Promise<User> {
    return super.update(userData, 'users')
  }

  async checkLogin (email: string, password: string) {
    const userData = await mongo.db.collection('users').findOne({ email })
    if (userData?.password && userData?.salt && checkSaltedHash(password, userData.password, userData.salt)) return this.cleanse(userData)
  }
}

UserService.onStartup(async () => {
  mongo.db.collection('users').createIndex('email', { unique: true })
})
