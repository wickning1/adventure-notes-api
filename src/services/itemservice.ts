import { DataLoaderFactory } from 'dataloader-factory'
import { ObjectId } from 'mongodb'
import { Item, ItemFilters, ItemCreate, ItemUpdate } from '../models'
import { push } from '../lib'
import { BaseService } from '.'
import { KnownByServiceHelper, KnownByService, AlignmentServiceHelper, NameServiceHelper } from '../mixins'

DataLoaderFactory.registerOneToMany<ObjectId, Item>('itemsByCharacterId', {
  fetch: async (ids, filters) => {
    return ItemService.find({ ...filters, heldBy: { $in: ids } })
  },
  extractKey: item => item.heldBy!,
  idLoaderKey: 'items'
})

export class ItemService extends BaseService<Item> {
  static get dlname () { return 'items' }
  static get ModelClass () { return Item }

  private knownByService = new KnownByService(this)

  async filters (filter: ItemFilters) {
    const ret = await super.filters(filter)

    if (filter.isHeld) ret.push({ heldBy: { $ne: null } })
    else if (filter.isHeld === false) ret.push({ heldBy: null })

    if (filter.heldBy?.length) ret.push({ heldBy: { $in: filter.heldBy } })

    return ret
  }

  async getByCharacterId (id: ObjectId, filters?: ItemFilters) {
    return this.getOneToMany('itemsByCharacterId', id, filters)
  }

  async presave (info: any) {
    if (info.heldBy) info.knownby = push(info.knownby, info.heldBy)
  }

  async create (info: ItemCreate) {
    await this.presave(info)
    return super.create(info)
  }

  async save (info: ItemUpdate) {
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

ItemService.setHelpers(NameServiceHelper, KnownByServiceHelper, AlignmentServiceHelper)

ItemService.onStartup(async () => {
  await ItemService.createIndex('heldBy', { sparse: true })
})
