import { ObjectType, Field, FieldResolver, Root, Ctx, Resolver, InputType, Query, Arg } from 'type-graphql'
import { Context, ObjectIdScalar } from '../lib'
import { Alignment, AlignmentDetails } from '../nested'
import { Adventure, User } from '.'
import { withKnownByResolver, withKnownBy, withId, BaseUpdateInput, BaseFilterInput } from '../mixins'
import { ObjectId } from 'mongodb'

@ObjectType({ isAbstract: true })
@InputType()
export class CharacterDetails {
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
  adventure!: ObjectId
}

@InputType()
export class CharacterUpdate extends BaseUpdateInput {
  @Field({ nullable: true })
  name?: string

  @Field(type => [String], { nullable: true })
  aliases?: string[]

  @Field(type => AlignmentDetails, { nullable: true })
  alignment?: AlignmentDetails
}

@InputType()
export class CharacterFilters extends BaseFilterInput {
  @Field(type => [ObjectIdScalar], { nullable: true })
  adventures?: ObjectId[]

  @Field({ nullable: true, description: 'When true, query only returns characters for which the user is permitted to use the "Point of View" feature.' })
  mayLoginAs?: boolean
}

@Resolver(of => Character)
export class CharacterResolver extends withKnownByResolver(Character, Object) {
  @Query(returns => [Character])
  async characters (@Ctx() ctx: Context, @Arg('filter', { nullable: true }) filter?: CharacterFilters) {
    return []
  }

  /** Local References **/
  @FieldResolver(returns => Adventure)
  async adventure (@Root() character: Character, @Ctx() ctx: Context) {
    return new Adventure() // TODO
  }

  /** Foreign References **/
  @FieldResolver(returns => User, { nullable: true })
  async player (@Root() character: Character, @Ctx() ctx: Context) {
    return new User()
  }
}
