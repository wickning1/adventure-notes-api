import { ObjectType, Field, Int, Resolver, Query, Arg, FieldResolver, InputType, ID } from 'type-graphql'
import { MongoID, Ref } from '../lib'
import { Character, User } from '.'
import { withId } from '../mixins'

@ObjectType({ isAbstract: true })
@InputType('AdventureDetailsInput', { isAbstract: true })
export class AdventureDetails {
  @Field()
  name!: string
}

@ObjectType()
export class Adventure extends withId(AdventureDetails) {
  @Field(type => Int)
  day!: number

  /** Local References **/
  @Field(type => User)
  dm!: Ref<User>
}

@Resolver(of => Adventure)
export class AdventureResolver {
  @Query(returns => [Adventure])
  async adventures (@Arg('ids', type => [ID]) ids: MongoID[]): Promise<Adventure[]> {
    return []
  }

  /** Local References **/
  @FieldResolver(returns => User)
  async dm () {
    return new User()
  }

  /** Foreign References **/
  @FieldResolver(returns => [Character])
  async characters (): Promise<Character[]> {
    return []
  }
}
