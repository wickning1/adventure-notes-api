import { ClassType, InputType, ObjectType, FieldResolver, Root, Field, Resolver, Ctx } from 'type-graphql'
import { Character, Adventure } from '../models'
import { ObjectId } from 'mongodb'
import { Context, ObjectIdScalar } from '../lib'
import { BaseFilterInput } from './document'
import { DataLoaderFactory } from 'dataloader-factory'
import { BaseService, BaseServiceMixin, ServiceMixinHelper, BasicModel } from '../services'
import { ValidationError } from 'apollo-server'

export function withKnownBy<T extends ClassType> (NextMixinClass: T) {
  @ObjectType({ isAbstract: true })
  @InputType({ isAbstract: true })
  class KnownByTrait extends NextMixinClass {
    @Field(type => [ObjectIdScalar])
    knownby: ObjectId[] = []

    @Field()
    adventure!: ObjectId
  }
  return KnownByTrait
}

export function withKnownByResolver<T extends ClassType, M extends ClassType> (ObjectClass: T, NextMixinClass: M) {
  @Resolver(of => ObjectClass, { isAbstract: true })
  abstract class KnownByResolver extends NextMixinClass {
    @FieldResolver(returns => [Character])
    async knownby (@Root() obj: { knownby: ObjectId[] }, @Ctx() ctx: Context) {
      return []
    }

    @FieldResolver(returns => Adventure)
    async adventure (@Root() item: any, @Ctx() ctx: Context) {
      return ctx.adventureService.get(item.adventure)
    }
  }
  return KnownByResolver
}

@InputType({ isAbstract: true })
export class KnownByFilterInput extends BaseFilterInput {
  @Field(type => [ObjectIdScalar], { nullable: true })
  adventures?: ObjectId[]

  @Field(type => [ObjectIdScalar], { nullable: true })
  knownby?: ObjectId[]

  @Field({ nullable: true, description: 'When true, known-by filter will be skipped. Good for presenting a list of things to teach to the currently logged in character.' })
  ignoreKnownBy?: boolean
}

export class KnownByServiceHelper extends ServiceMixinHelper {
  static async onStartup (service: typeof BaseService) {
    DataLoaderFactory.registerOneToMany(service.dlname + 'ByAdventureId', {
      fetch: async (adventureIds, filter) => {
        return service.find({ ...filter, adventure: { $in: adventureIds } })
      },
      extractKey: item => item.adventure
    })
    await service.createIndex('knownby')
    await service.createIndex('adventure')
  }

  static async authfilters (ctx: Context, graphqlfilter: any) {
    const authfilters: any[] = []
    if (ctx.adventure && ctx.character) {
      authfilters.push({ adventure: ctx.adventure })
      if (!graphqlfilter.ignoreKnownBy) authfilters.push({ knownby: ctx.character })
    } else if (ctx.adventure) {
      authfilters.push({ adventure: ctx.adventure })
      if (!graphqlfilter.ignoreKnownBy) {
        const [adventure, characters] = await Promise.all([
          ctx.getAdventure(),
          ctx.getCharacters()
        ])
        if (!adventure?.gamemaster.equals(ctx.user!)) {
          authfilters.push({ knownby: { $in: characters!.filter(c => c.adventure.equals(ctx.adventure!)).map(c => c.id) } })
        }
      }
    } else {
      const [characters, adventures] = await Promise.all([
        ctx.getCharacters(),
        ctx.getGMAdventures()
      ])
      authfilters.push({ adventure: { $in: [...characters.map(c => c.adventure), ...adventures.map(a => a.id)] } })
      if (!graphqlfilter.ignoreKnownBy) {
        authfilters.push({
          $or: [
            { knownby: { $in: characters.map(c => c.id) } },
            { adventure: { $in: adventures.map(a => a.id) } }
          ]
        })
      }
    }
    return authfilters
  }

  async filters (graphqlfilter: KnownByFilterInput) {
    const ret = []
    if (graphqlfilter.adventures?.length) ret.push({ adventure: { $in: graphqlfilter.adventures } })
    if (graphqlfilter.knownby?.length) ret.push({ knownby: { $in: graphqlfilter.knownby } })
    return ret
  }

  async cleanse (item: any) {
    if (this.ctx.character && !item.knownby.some((charId:ObjectId) => charId.equals(this.ctx.character!))) {
      const keep = ['_id', 'name']
      for (const key of Object.keys(item)) {
        if (!keep.includes(key)) delete item[key]
      }
    }
  }

  async presave (item: any) {
    if (!item.adventure) item.adventure = this.ctx.adventure
    if (!item.adventure) throw new ValidationError('Cannot create new records when not logged in to an adventure.')
    if (!item.knownby) item.knownby = []
    if (this.ctx.character && item.knownby.every((charId: ObjectId) => !charId.equals(this.ctx.character!))) {
      item.knownby.push(this.ctx.character)
    }
  }
}

export class KnownByService<M extends BasicModel> extends BaseServiceMixin<M> {
  async getByAdventureId (adventureId: ObjectId, graphqlfilter: any) {
    return this.service.getOneToMany(this.service.dlname + 'ByAdventureId', adventureId, graphqlfilter)
  }

  async addKnownBy (ids: ObjectId[], characterIds: ObjectId[]) {
    const cleanCharacterIds = await this.service.ctx.characterService.getMany(characterIds)
    return this.service.updateMany({ $addToSet: { knownby: cleanCharacterIds.map(c => c.id) } }, { _id: { $in: ids } })
  }
}
