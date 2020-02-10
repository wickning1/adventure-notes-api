import { DataLoaderFactory } from 'dataloader-factory'
import { UserService, AdventureService } from '../services'
import jwt from 'jsonwebtoken'
import { ObjectId } from 'mongodb'

export class Context {
  public adventure?: ObjectId
  public user?: ObjectId
  public character?: ObjectId
  public dataLoaderFactory: DataLoaderFactory
  private adventureServiceInstance?: AdventureService
  private userServiceInstance?: UserService

  constructor (authHeader: string | undefined, dataLoaderFactory: DataLoaderFactory) {
    if (!process.env.JWT_SECRET) throw new Error('JWT secret has not been set. The server is misconfigured.')
    this.dataLoaderFactory = dataLoaderFactory
    const m = authHeader?.match(/^bearer (.*)$/i)
    const token = m?.[1]
    const payload: any = token ? jwt.verify(token, process.env.JWT_SECRET) : {}
    this.adventure = payload.adventure
    this.user = payload.user
    this.character = payload.character
  }

  get adventureService () {
    if (!this.adventureServiceInstance) this.adventureServiceInstance = new AdventureService(this)
    return this.adventureServiceInstance
  }

  get userService () {
    if (!this.userServiceInstance) this.userServiceInstance = new UserService(this)
    return this.userServiceInstance
  }

  getToken (payload: { user: ObjectId, adventure?: ObjectId, character?: ObjectId }) {
    if (!process.env.JWT_SECRET) throw new Error('JWT secret has not been set. The server is misconfigured.')
    return jwt.sign(payload, process.env.JWT_SECRET)
  }
}
