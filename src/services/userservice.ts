import { mongo, saltAndHash, checkSaltedHash } from '../lib'
import { createBaseService } from '.'
// import { DataLoaderFactory } from 'dataloader-factory'
import { User, UserInput, UserUpdate } from '../models'
import { UserInputError } from 'apollo-server'

export class UserService extends createBaseService('users', User) {
  cleanse (item: any) {
    return { ...item, email: item._id.toString() === this.ctx.user ? item.email : '' }
  }

  async create (userData: UserInput) {
    if (!userData.password?.length) throw new UserInputError('Password is required.')
    const { hash, salt } = saltAndHash(userData.password)
    const doc = { ...userData, password: hash, salt }
    return super.create(doc)
  }

  async update (userData: UserUpdate): Promise<User> {
    const updatedoc:any = { ...userData }
    if (userData.password) {
      const { hash, salt } = saltAndHash(userData.password)
      updatedoc.password = hash
      updatedoc.salt = salt
    }
    return super.update(updatedoc)
  }

  async checkLogin (email: string, password: string) {
    const userData = await mongo.db.collection('users').findOne({ email })
    if (userData?.password && userData?.salt && checkSaltedHash(password, userData.password, userData.salt)) return this.toModel(userData)
  }
}

UserService.onStartup(async () => {
  mongo.db.collection('users').createIndex('email', { unique: true })
})
