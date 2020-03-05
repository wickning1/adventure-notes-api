import { DataLoaderFactory } from 'dataloader-factory'
import { ObjectId } from 'mongodb'
import { BaseService } from '.'
import { KnownByServiceHelper, KnownByService, AlignmentServiceHelper, NameServiceHelper } from '../mixins'
import { Location, LocationFilters, LocationCreate, LocationUpdate } from '../models'
import { toArray } from '../lib'

DataLoaderFactory.registerOneToMany<ObjectId, Location>('locationsByParentId', {
  fetch: async (ids, filters) => {
    return LocationService.find({ ...filters, inside: { $in: ids } })
  },
  extractKey: location => location.inside!,
  idLoaderKey: 'locations'
})

export class LocationService extends BaseService<Location> {
  static get dlname () { return 'locations' }
  static get ModelClass () { return Location }

  private knownByService = new KnownByService(this)

  async filters (filter: LocationFilters) {
    const ret = await super.filters(filter)

    if (filter.isInsideAnother) ret.push({ inside: { $ne: null } })
    else if (filter.isInsideAnother === false) ret.push({ inside: null })

    if (filter.inside?.length) ret.push({ inside: { $in: filter.inside } })

    if (filter.homestead) ret.push({ homestead: true })
    else if (filter.homestead === false) ret.push({ homestead: false })

    return ret
  }

  async getByParentId (id: ObjectId, filters?: LocationFilters) {
    return this.getOneToMany('locationsByParentId', id, filters)
  }

  async collectParents (ids: ObjectId[]): Promise<ObjectId[]> {
    if (!ids?.length) return []
    const locations = await this.find({ _id: { $in: ids } })
    const moreids = locations.map(l => l.inside).filter(Boolean) as ObjectId[]
    if (moreids.length) return moreids.concat(await this.collectParents(moreids))
    return []
  }

  async presave (info: LocationCreate | LocationUpdate) {
    if (!info.homestead) info.homestead = false
    if (info.inside) {
      const inside = await this.get(info.inside)
      if (!inside) this.ctx.recordValidationError('inside', 'Cannot place a location inside a location you do not currently know about.')
    }
  }

  async create (info: LocationCreate) {
    await this.presave(info)
    return super.create(info)
  }

  async save (info: LocationUpdate) {
    await this.presave(info)
    return super.save(info)
  }

  async getByAdventureId (adventureId: ObjectId, graphqlfilter?: any) {
    return this.knownByService.getByAdventureId(adventureId, graphqlfilter)
  }

  async addKnownBy (ids: ObjectId[]|undefined, characterIds: ObjectId[]) {
    const idarray = toArray(ids)
    const moreids = await this.collectParents(idarray)
    return this.knownByService.addKnownBy([...idarray, ...moreids], characterIds)
  }
}

LocationService.setHelpers(NameServiceHelper, KnownByServiceHelper, AlignmentServiceHelper)

LocationService.onStartup(async () => {
  await LocationService.createIndex('inside', { sparse: true })
  await LocationService.createIndex('homestead')
})
