import { ObjectType, Field, Int, Resolver, Query, Arg, FieldResolver, InputType, Mutation, Ctx, Root } from 'type-graphql'
import { ObjectIdScalar, Context } from '../lib'
import { Character, User } from '.'
import { withId, BaseUpdateInput, BaseFilterInput } from '../mixins'
import { ObjectId } from 'mongodb'

@ObjectType({ isAbstract: true })
@InputType()
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
  gamemaster!: ObjectId
}

@InputType()
export class AdventureUpdate extends BaseUpdateInput {
  @Field({ nullable: true })
  name?: string

  @Field(type => Int, { nullable: true })
  day?: number

  @Field({ nullable: true })
  gamemaster?: ObjectId
}

@InputType()
export class AdventureFilter extends BaseFilterInput {
  @Field(type => [ObjectIdScalar], { nullable: true })
  gamemasters?: ObjectId[]
}

@Resolver(of => Adventure)
export class AdventureResolver {
  @Query(returns => [Adventure])
  async adventures (@Ctx() ctx: Context, @Arg('filter', { nullable: true }) filter?: AdventureFilter): Promise<Adventure[]> {
    return ctx.adventureService.getFiltered(filter)
  }

  /** Local References **/
  @FieldResolver(returns => User)
  async gamemaster (@Root() adventure: Adventure, @Ctx() ctx: Context) {
    return ctx.userService.get(adventure.gamemaster)
  }

  /** Foreign References **/
  @FieldResolver(returns => [Character])
  async characters (): Promise<Character[]> {
    return []
  }

  @Mutation(returns => Adventure)
  async createAdventure (@Arg('info') info: AdventureDetails, @Ctx() ctx: Context) {
    return ctx.adventureService.create(info)
  }

  @Mutation(returns => Adventure)
  async updateAdventure (@Arg('info') info: AdventureUpdate, @Ctx() ctx: Context) {
    return ctx.adventureService.save(info)
  }

  @Mutation(returns => Boolean)
  async updateKnownBy (
    @Ctx() ctx: Context,
    @Arg('nowKnownBy', type => [ObjectIdScalar]) nowKnownBy: ObjectId[],
    @Arg('characters', type => [ObjectIdScalar], { nullable: true }) characters: ObjectId[]
  ) {
    return ctx.characterService.addKnownBy(characters, nowKnownBy)
  }
}
