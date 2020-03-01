import { ClassType, InputType, ObjectType, FieldResolver, Root, Field, Resolver, Ctx, Info } from 'type-graphql'
import { Character, Adventure } from '../models'
import { ObjectId } from 'mongodb'
import { Context, ObjectIdScalar, UnauthenticatedError, onlyResolveId, toClass } from '../lib'
import { BaseFilterInput } from './document'
import { DataLoaderFactory } from 'dataloader-factory'
import { BaseService, BaseServiceMixin, ServiceMixinHelper, BasicModel } from '../services'
import { ValidationError } from 'apollo-server'
import { GraphQLResolveInfo } from 'graphql'

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
    async knownby (@Root() obj: { knownby: ObjectId[] }, @Ctx() ctx: Context, @Info() info: GraphQLResolveInfo) {
      return ctx.characterService.getMany(obj.knownby, info)
    }

    @FieldResolver(returns => Adventure)
    async adventure (@Root() item: any, @Ctx() ctx: Context, @Info() info: GraphQLResolveInfo) {
      if (onlyResolveId(info)) return toClass({ _id: item.adventure }, Adventure)
      return ctx.adventureService.get(item.adventure, info)
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

  async presave (item: any) {
    if (!this.ctx.user) throw new UnauthenticatedError()
    if (!item.adventure) item.adventure = this.ctx.adventure
    if (!item.adventure) throw new ValidationError('Cannot create new records when not logged in to an adventure.')
    if (!item.knownby) item.knownby = []
    if (this.ctx.character && item.knownby.every((charId: ObjectId) => !charId.equals(this.ctx.character!))) {
      item.knownby.push(this.ctx.character)
    }
    item.knownby = Array.from(new Set(item.knownby))
  }
}

export class KnownByService<M extends BasicModel> extends BaseServiceMixin<M> {
  async getByAdventureId (adventureId: ObjectId, graphqlfilter?: any) {
    return this.service.getOneToMany(this.service.dlname + 'ByAdventureId', adventureId, graphqlfilter)
  }

  async addKnownBy (ids: ObjectId[], characterIds: ObjectId[], skipAuth?: boolean) {
    if (!ids?.length || !characterIds?.length) return true
    const cleanCharacterIds = skipAuth ? (await this.service.ctx.characterService.getMany(characterIds)).map(c => c.id) : characterIds
    if (!cleanCharacterIds?.length) return true
    return this.service.updateMany({ $addToSet: { knownby: { $each: cleanCharacterIds } } }, { _id: { $in: ids } })
  }
}
