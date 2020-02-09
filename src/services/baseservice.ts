import { DataLoaderFactory } from 'dataloader-factory'

export class BaseService {
  protected dataLoaderFactory: DataLoaderFactory
  constructor (dataLoaderFactory: DataLoaderFactory) {
    this.dataLoaderFactory = dataLoaderFactory
  }
}
