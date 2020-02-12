import { createBaseService } from './baseservice'
import { AdventureUpdate, Adventure, AdventureDetails } from '../models'

export class AdventureService extends createBaseService('adventures', Adventure) {
  async create (info: AdventureDetails) {
    return super.create(info)
  }

  async update (info: AdventureUpdate): Promise<Adventure> {
    return super.update(info)
  }
}
