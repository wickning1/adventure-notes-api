import { ID, ClassType, ObjectType, InputType, Field } from 'type-graphql'
import { MongoID } from '../lib'

export function withId<T extends ClassType> (NextMixinClass: T) {
  @ObjectType({ isAbstract: true })
  @InputType({ isAbstract: true })
  class IDTrait extends NextMixinClass {
    @Field(type => ID)
    id!: MongoID
  }
  return IDTrait
}
