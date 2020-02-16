import { KnownByService } from './baseservice'
import { CharacterUpdate, Character, CharacterDetails, CharacterFilters, Adventure } from '../models'
import { ObjectId } from 'mongodb'
import { DataLoaderFactory } from 'dataloader-factory'
import { UnauthenticatedError } from '../lib'
import { AdventureService } from './adventureservice'

DataLoaderFactory.registerOneToMany<ObjectId, Character>('characterByPlayerId', {
  fetch: async (ids, filters) => {
    return CharacterService.find({ ...filters, gamemasters: ids })
  },
  extractKey: character => character.player,
  idLoaderKey: 'characters'
})

export class CharacterService extends KnownByService<Character> {
  static get dlname () { return 'characters' }
  static get ModelClass () { return Character }

  async translatefilters (filter: CharacterFilters) {
    const ret = await super.translatefilters(filter)
    return ret
  }

  async mayLoginAs (adventureId?: ObjectId) {
    if (!this.ctx.user) throw new UnauthenticatedError()

    const [myCharacters, myAdventures] = await Promise.all<Character[], Adventure[]>([
      CharacterService.find({ player: this.ctx.user, ...(adventureId ? { adventure: adventureId } : {}) }),
      AdventureService.find({ gamemaster: this.ctx.user, ...(adventureId ? { _id: adventureId } : {}) })
    ])
    const moreCharacters = await CharacterService.find<Character>({ adventure: { $in: myAdventures.map(a => a.id) } })
    return [...myCharacters, ...moreCharacters]
  }

  async getByPlayerId (id: ObjectId, filters?: CharacterFilters) {
    return this.getOneToMany('characterByPlayerId', id, filters)
  }

  async create (info: CharacterDetails) {
    return super.create({ ...info, knownby: this.ctx.character ? [this.ctx.character] : [] })
  }

  async save (info: CharacterUpdate): Promise<Character> {
    return super.save(info)
  }
}

CharacterService.onStartup(async () => {
  await CharacterService.createIndex('name', { unique: true })
  await CharacterService.createIndex('player', { sparse: true })
})
