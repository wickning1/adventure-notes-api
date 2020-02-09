import { ID, ClassType, ObjectType, InputType, Field, Int } from 'type-graphql'
import { MongoID } from '../lib'

export function withId<T extends ClassType> (NextMixinClass: T) {
  @ObjectType({ isAbstract: true })
  @InputType({ isAbstract: true })
  class IDTrait extends NextMixinClass {
    @Field(type => ID)
    get id (): MongoID { return this._id.toString() }

    @Field(type => Int)
    documentVersion!: number
  }
  return IDTrait
}
