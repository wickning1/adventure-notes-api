import { MongoID, toClass, saltAndHash, checkSaltedHash, toArray } from '../lib'
import { BaseService } from '.'
import { db } from '../lib/db'
import { DataLoaderFactory } from 'dataloader-factory'
import { User, UserInput } from '../models'

DataLoaderFactory.register('users', {
  fetch: async (ids: MongoID[]) => {
    return db.collection('users').find({ id: ids }).toArray()
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

  async get (id: MongoID) {
    return this.cleanse(await this.ctx.dataLoaderFactory.get('users').load(id))
  }

  async getMany () {
    const users = await db.collection('users').find().toArray()
    return this.cleanse(users)
  }

  async create (userData: UserInput) {
    if (!userData.password?.length) throw new Error('Password is required.')
    const { hash, salt } = saltAndHash(userData.password)
    const user = { ...userData, password: hash, salt, _version: 0 }
    const insertId = (await db.collection('users').insertOne(user)).insertedId
    return this.cleanse({ ...user, _id: insertId })
  }

  async checkLogin (email: string, password: string) {
    const userData = await db.collection('users').findOne({ email })
    if (userData?.password && userData?.salt && checkSaltedHash(password, userData.password, userData.salt)) return this.cleanse(userData)
  }
}

UserService.onStartup(async () => {
  db.collection('users').createIndex('email', { unique: true })
})
