import { DataLoaderFactory } from 'dataloader-factory'
import jwt from 'jsonwebtoken'
import lodash from 'lodash'
import { ObjectId } from 'mongodb'
import { UserService, AdventureService, CharacterService, ItemService, LocationService } from '../services'
import { Character, Adventure } from '../models'
import { FieldError } from './errors'

export class Context {
  public adventure?: ObjectId
  public user?: ObjectId
  public character?: ObjectId
  public superadmin: boolean
  public dataLoaderFactory: DataLoaderFactory<Context>
  public validationErrors: FieldError[] = []
  private adventureServiceInstance?: AdventureService
  private userServiceInstance?: UserService
  private characterServiceInstance?: CharacterService
  private itemServiceInstance?: ItemService
  private locationServiceInstance?: LocationService
  private cache:any = {}

  constructor (authHeader: string | undefined) {
    this.dataLoaderFactory = new DataLoaderFactory(this)
    const m = authHeader?.match(/^bearer (.*)$/i)
    const token = m?.[1]
    const payload: any = token ? jwt.verify(token, this.jwtSecret) : {}
    this.adventure = payload.adventure ? new ObjectId(payload.adventure) : undefined
    this.user = payload.user ? new ObjectId(payload.user) : undefined
    this.character = payload.character ? new ObjectId(payload.character) : undefined
    this.superadmin = payload.superadmin || false
  }

  get adventureService () {
    if (!this.adventureServiceInstance) this.adventureServiceInstance = new AdventureService(this)
    return this.adventureServiceInstance
  }

  get userService () {
    if (!this.userServiceInstance) this.userServiceInstance = new UserService(this)
    return this.userServiceInstance
  }

  get characterService () {
    if (!this.characterServiceInstance) this.characterServiceInstance = new CharacterService(this)
    return this.characterServiceInstance
  }

  get itemService () {
    if (!this.itemServiceInstance) this.itemServiceInstance = new ItemService(this)
    return this.itemServiceInstance
  }

  get locationService () {
    if (!this.locationServiceInstance) this.locationServiceInstance = new LocationService(this)
    return this.locationServiceInstance
  }

  async getCharacter () {
    if (!this.cache.character) this.cache.character = (await CharacterService.find({ _id: this.character }))?.[0]
    return this.cache.character as Character | undefined
  }

  async getAdventure () {
    if (!this.cache.adventure) this.cache.adventure = (await AdventureService.find({ _id: this.adventure }))?.[0]
    return this.cache.adventure as Adventure | undefined
  }

  async getCharacters () {
    if (!this.cache.characters) this.cache.characters = await CharacterService.find({ player: this.user })
    return this.cache.characters as Character[]
  }

  async getGMAdventures () {
    if (!this.cache.gmadventures) this.cache.gmadventures = (await AdventureService.find({ gamemaster: this.user }))
    return this.cache.gmadventures as Adventure[]
  }

  async getAdventures () {
    if (!this.cache.adventures) {
      const [characters, gmadventures] = await Promise.all([
        this.getCharacters(),
        this.getGMAdventures()
      ])
      const moreadventureids = lodash.differenceBy(characters.map(c => c.adventure), gmadventures.map(a => a.id), id => id.toHexString())
      const moreadventures = await AdventureService.find({ _id: { $in: moreadventureids } })
      this.cache.adventures = [...gmadventures, ...moreadventures]
    }
    return this.cache.adventures as Adventure[]
  }

  async getFriends () {
    if (!this.cache.friends) {
      if (this.adventure) {
        const [adventure, otherpcs] = await Promise.all([
          this.getAdventure(),
          CharacterService.find<Character>({ player: { $ne: null }, adventure: this.adventure })
        ])
        this.cache.friends = [adventure!.gamemaster, ...otherpcs!.map(c => c.player)]
      } else {
        const adventures = await this.getAdventures()
        const otherpcs = await CharacterService.find({ player: { $nin: [this.user, null] }, adventure: { $in: adventures.map(a => a.id) } })
        this.cache.friends = [...adventures.map(a => a.gamemaster), ...otherpcs.map(c => c.player)]
      }
    }
    return this.cache.friends as ObjectId[]
  }

  private get jwtSecret () {
    if (!process.env.JWT_SECRET) throw new Error('JWT secret has not been set. The server is misconfigured.')
    return process.env.JWT_SECRET
  }

  getToken (payload: { user: ObjectId, adventure?: ObjectId, character?: ObjectId }) {
    return jwt.sign(payload, this.jwtSecret)
  }

  recordValidationError (field: string, message?: string) {
    this.validationErrors.push({ field, message })
  }
}
