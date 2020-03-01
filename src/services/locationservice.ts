import { DataLoaderFactory } from 'dataloader-factory'
import { ObjectId } from 'mongodb'
import { BaseService } from '.'
import { KnownByServiceHelper, KnownByService, AlignmentServiceHelper, NameServiceHelper } from '../mixins'
import { Location, LocationFilters, LocationCreate, LocationUpdate } from '../models'

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

    return ret
  }

  async getByParentId (id: ObjectId, filters?: LocationFilters) {
    return this.getOneToMany('locationsByParentId', id, filters)
  }

  async presave (info: any) {

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

  async addKnownBy (ids: ObjectId[], characterIds: ObjectId[]) {
    return this.knownByService.addKnownBy(ids, characterIds)
  }
}

LocationService.setHelpers(NameServiceHelper, KnownByServiceHelper, AlignmentServiceHelper)

LocationService.onStartup(async () => {
  await LocationService.createIndex('inside', { sparse: true })
})
