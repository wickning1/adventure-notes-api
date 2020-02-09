import { MongoID } from '.'
import { DataLoaderFactory } from 'dataloader-factory'
import { UserService } from '../services'

export class Context {
  public adventure: MongoID
  public user: MongoID
  public character: MongoID
  private dataLoaderFactory: DataLoaderFactory
  private userServiceInstance?: UserService

  constructor (jwt: string, dataLoaderFactory: DataLoaderFactory) {
    this.dataLoaderFactory = dataLoaderFactory
    this.adventure = ''
    this.user = ''
    this.character = ''
  }

  get userService () {
    return this.userServiceInstance || new UserService(this.dataLoaderFactory)
  }
}
