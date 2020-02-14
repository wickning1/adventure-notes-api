import { KnownByService } from './baseservice'
import { CharacterUpdate, Character, CharacterDetails, CharacterFilters } from '../models'
import { ObjectId } from 'mongodb'
// import { DataLoaderFactory } from 'dataloader-factory'

export class CharacterService extends KnownByService<Character> {
  static get dlname () { return 'adventures' }
  static get ModelClass () { return Character }

  async translatefilters (filter: CharacterFilters) {
    const ret = await super.translatefilters(filter)
    if (filter.adventures) ret.adventure = { $in: filter.adventures }
    if (filter.mayLoginAs) ret.player = this.ctx.user
    return ret
  }

  async getByDmId (id: ObjectId) {
    return this.ctx.dataLoaderFactory.getOneToMany<ObjectId, Character>('adventureByDmId').load(id)
  }

  async create (info: CharacterDetails) {
    return super.create(info)
  }

  async update (info: CharacterUpdate): Promise<Character> {
    return super.update(info)
  }
}

CharacterService.onStartup(async () => {
  await CharacterService.createIndex('name', { unique: true })
  await CharacterService.createIndex('adventure')
})
