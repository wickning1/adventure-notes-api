import { mongo, saltAndHash, checkSaltedHash } from '../lib'
import { BaseService } from '.'
// import { DataLoaderFactory } from 'dataloader-factory'
import { User, UserInput, UserUpdate } from '../models'
import { UserInputError } from 'apollo-server'

export class UserService extends BaseService<User> {
  static get dlname () { return 'users' }
  static get ModelClass () { return User }

  async cleanse (item: User) {
    if (!item.id.equals(this.ctx.user!)) delete item.email
    return super.cleanse(item)
  }

  async create (userData: UserInput) {
    if (!userData.password?.length) throw new UserInputError('Password is required.')
    const { hash, salt } = saltAndHash(userData.password)
    const doc = { ...userData, password: hash, salt }
    return super.create(doc)
  }

  async save (userData: UserUpdate): Promise<User> {
    const updatedoc:any = { ...userData }
    if (userData.password) {
      const { hash, salt } = saltAndHash(userData.password)
      updatedoc.password = hash
      updatedoc.salt = salt
    }
    return super.save(updatedoc)
  }

  async checkLogin (email: string, password: string) {
    const userData = await mongo.db.collection('users').findOne({ email })
    if (userData?.password && userData?.salt && checkSaltedHash(password, userData.password, userData.salt)) {
      return userData._id.toString()
    }
  }
}

UserService.onStartup(async () => {
  UserService.createIndex('email', { unique: true })
})
