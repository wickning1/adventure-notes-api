import { ObjectType, Field, FieldResolver, Root, Ctx, Resolver, InputType, Query, Arg, ID } from 'type-graphql'
import { Context, Ref, MongoID } from '../lib'
import { Alignment } from '../nested'
import { Adventure, User } from '.'
import { withKnownByResolver, withKnownBy, withId } from '../mixins'

@ObjectType({ isAbstract: true })
@InputType('CharacterDetailsInput', { isAbstract: true })
class CharacterDetails {
  @Field()
  name!: string

  @Field(type => [String])
  aliases!: string[]

  @Field()
  alignment!: Alignment
}

@ObjectType()
export class Character extends withKnownBy(withId(CharacterDetails)) {
  /** Local References **/
  @Field(type => Adventure)
  adventure!: Ref<Adventure>
}

@Resolver(of => Character)
export class CharacterResolver extends withKnownByResolver(Character, Object) {
  @Query(returns => [Character])
  async characters (
    @Arg('adventure', type => ID) adventure: MongoID,
    @Arg('mayLoginAs', { nullable: true, description: 'When true, query only returns characters for which the user is permitted to use the "Point of View" feature.' }) mayLoginAs: boolean
  ) {
    return []
  }

  /** Local References **/
  @FieldResolver(returns => Adventure)
  async adventure (@Root() character: Character, @Ctx() ctx: Context) {
    return new Adventure() // TODO
  }

  /** Foreign References **/
  @FieldResolver(returns => User)
  async player (@Root() character: Character, @Ctx() ctx: Context) {
    return new User()
  }
}
