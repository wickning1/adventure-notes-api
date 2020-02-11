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
    this.dataLoaderFactory = dataLoaderFactory
    const m = authHeader?.match(/^bearer (.*)$/i)
    const token = m?.[1]
    const payload: any = token ? jwt.verify(token, this.jwtSecret) : {}
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

  private get jwtSecret () {
    if (!process.env.JWT_SECRET) throw new Error('JWT secret has not been set. The server is misconfigured.')
    return process.env.JWT_SECRET
  }

  getToken (payload: { user: ObjectId, adventure?: ObjectId, character?: ObjectId }) {
    return jwt.sign(payload, this.jwtSecret)
  }
}
