import { DataLoaderFactory } from 'dataloader-factory'
import { ObjectId } from 'mongodb'
import { Character, CharacterFilters, Adventure, CharacterCreate, User, CharacterUpdate } from '../models'
import { UnauthenticatedError, randomString } from '../lib'
import { BaseService, AdventureService } from '.'
import { KnownByServiceHelper, KnownByService, AlignmentServiceHelper } from '../mixins'
import { UserService } from './userservice'

DataLoaderFactory.registerOneToMany<ObjectId, Character>('charactersByPlayerId', {
  fetch: async (ids, filters) => {
    return CharacterService.find({ ...filters, player: { $in: ids } })
  },
  extractKey: character => character.player!,
  idLoaderKey: 'characters'
})

export class CharacterService extends BaseService<Character> {
  static get dlname () { return 'characters' }
  static get ModelClass () { return Character }

  private knownByService = new KnownByService(this)

  async translatefilters (filter: CharacterFilters) {
    const ret = await super.filters(filter)

    if (filter.mayLoginAs) {
      const charIds = (await this.mayLoginAs(this.ctx.adventure)).map(c => c.id)
      ret.push({ _id: { $in: charIds } })
    }

    if (filter.isPlayerCharacter) ret.push({ player: { $ne: null } })
    else if (filter.isPlayerCharacter === false) ret.push({ player: null })

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
    return this.getOneToMany('charactersByPlayerId', id, filters)
  }

  async presave (info: any) {
    if (info.playerEmail) {
      info.player = undefined
      const player = (await UserService.find<User>({ email: info.playerEmail }))[0]
      if (player) {
        delete info.playerEmail
        info.player = player.id
      } else {
        info.invitation = randomString()
      }
    }
  }

  async create (info: CharacterCreate) {
    await this.presave(info)
    if (!info.aliases) info.aliases = []
    const newitem = await super.create(info)
    await this.knownByService.addKnownBy([newitem.id], [newitem.id], true)
    newitem.knownby = newitem.knownby?.length ? [...newitem.knownby, newitem.id] : [newitem.id]
    return newitem
  }

  async save (info: CharacterUpdate) {
    await this.presave(info)
    return super.save(info)
  }

  async getByAdventureId (adventureId: ObjectId, graphqlfilter: any) {
    return this.knownByService.getByAdventureId(adventureId, graphqlfilter)
  }

  async addKnownBy (ids: ObjectId[], characterIds: ObjectId[]) {
    return this.knownByService.addKnownBy(ids, characterIds)
  }
}

CharacterService.setHelpers(KnownByServiceHelper, AlignmentServiceHelper)

CharacterService.onStartup(async () => {
  await CharacterService.createIndex('name', { unique: true })
  await CharacterService.createIndex('player', { sparse: true })
})
