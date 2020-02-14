import { ClassType, InputType, ObjectType, FieldResolver, Root, Field, Resolver, Ctx } from 'type-graphql'
import { Character, Adventure } from '../models'
import { ObjectId } from 'mongodb'
import { Context, ObjectIdScalar } from '../lib'
import { BaseFilterInput } from './document'

export function withKnownBy<T extends ClassType> (NextMixinClass: T) {
  @ObjectType({ isAbstract: true })
  @InputType({ isAbstract: true })
  class KnownByTrait extends NextMixinClass {
    @Field(type => [Character])
    knownby!: ObjectId[]

    @Field(type => Adventure)
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
    async adventure (@Root() character: Character, @Ctx() ctx: Context) {
      return new Adventure() // TODO
    }
  }
  return KnownByResolver
}

@InputType({ isAbstract: true })
export class KnownByFilterInput extends BaseFilterInput {
  @Field(type => [ObjectIdScalar], { nullable: true })
  knownby?: ObjectId[]
}
