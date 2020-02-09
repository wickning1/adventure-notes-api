import { MongoID } from '.'
import { DataLoaderFactory } from 'dataloader-factory'

export interface Context {
  adventure: MongoID
  user: MongoID
  character: MongoID
  dataFactory: DataLoaderFactory
}
