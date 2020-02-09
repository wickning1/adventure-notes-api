import { ClassType, InputType, ObjectType, FieldResolver, Root, Field, Resolver } from 'type-graphql'
import { Ref, MongoID } from '../lib'
import { Character } from '../models'

export function withKnownBy<T extends ClassType> (NextMixinClass: T) {
  @ObjectType({ isAbstract: true })
  @InputType({ isAbstract: true })
  class KnownByTrait extends NextMixinClass {
    @Field(type => [Character])
    knownby!: Ref<Character>
  }
  return KnownByTrait
}

export function withKnownByResolver<T extends ClassType, M extends ClassType> (ObjectClass: T, NextMixinClass: M) {
  @Resolver(of => ObjectClass, { isAbstract: true })
  abstract class KnownByResolver extends NextMixinClass {
    @FieldResolver(returns => [Character])
    async knownby (@Root() obj: { knownby: MongoID[] }) {
      return []
    }
  }
  return KnownByResolver
}
