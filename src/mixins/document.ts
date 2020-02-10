import { ClassType, ObjectType, InputType, Field, Int } from 'type-graphql'
import { ObjectId } from 'mongodb'

export function withId<T extends ClassType> (NextMixinClass: T) {
  @ObjectType({ isAbstract: true })
  @InputType({ isAbstract: true })
  class IDTrait extends NextMixinClass {
    @Field()
    get id (): ObjectId { return this._id }

    @Field(type => Int)
    _version!: number
  }
  return IDTrait
}

@InputType({ isAbstract: true })
export class BaseUpdateInput {
  @Field()
  id!: ObjectId

  @Field(type => Int)
  _version!: number
}
