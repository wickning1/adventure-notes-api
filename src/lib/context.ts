import { MongoID } from '.'
import { DataLoaderFactory } from 'dataloader-factory'
import { UserService } from '../services'
import jwt from 'jsonwebtoken'

export class Context {
  public adventure?: MongoID
  public user?: MongoID
  public character?: MongoID
  public dataLoaderFactory: DataLoaderFactory
  private userServiceInstance?: UserService

  constructor (authHeader: string | undefined, dataLoaderFactory: DataLoaderFactory) {
    if (!process.env.JWT_SECRET) throw new Error('JWT secret has not been set. The server is misconfigured.')
    this.dataLoaderFactory = dataLoaderFactory
    const m = authHeader?.match(/^bearer (.*)$/i)
    const token = m?.[1]
    const payload: any = token ? jwt.verify(token, process.env.JWT_SECRET) : {}
    console.log(payload)
    this.adventure = payload.adventure
    this.user = payload.user
    this.character = payload.character
  }

  get userService () {
    return this.userServiceInstance || new UserService(this)
  }

  getToken (payload: { user: MongoID, adventure?: MongoID, character?: MongoID }) {
    if (!process.env.JWT_SECRET) throw new Error('JWT secret has not been set. The server is misconfigured.')
    console.log(payload)
    return jwt.sign(payload, process.env.JWT_SECRET)
  }
}
