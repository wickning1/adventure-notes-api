import { GraphQLResolveInfo } from 'graphql'
import { ObjectId } from 'mongodb'
import { ObjectType, Field, Int, Resolver, Query, Arg, FieldResolver, InputType, Mutation, Ctx, Root, Info } from 'type-graphql'
import { ObjectIdScalar, Context, toClass } from '../lib'
import { User } from '.'
import { withId, BaseUpdateInput, BaseFilterInput } from '../mixins'

@ObjectType({ isAbstract: true })
@InputType()
export class AdventureDetails {
  @Field()
  name!: string
}

@ObjectType()
export class BasicNoteInfo extends withId(Object) {
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

function generateDescription (collName: string) {
  return `This is a special resolver that returns all the ${collName} associated with an adventure,
    even those the logged in character should not be able to see. All information is blanked
    out except the name. This is useful for showing a list when the user knows that their
    character just learned about something new, so that they can associate the new thing with
    their character.`
}

@Resolver(of => Adventure)
export class AdventureResolver {
  @Query(returns => [Adventure])
  async adventures (@Ctx() ctx: Context, @Arg('filter', { nullable: true }) filter?: AdventureFilter): Promise<Adventure[]> {
    return ctx.adventureService.getFiltered(filter)
  }

  /** Local References **/
  @FieldResolver(returns => User)
  async gamemaster (@Root() adventure: Adventure, @Ctx() ctx: Context, @Info() info: GraphQLResolveInfo) {
    return ctx.userService.get(adventure.gamemaster, info)
  }

  /** Foreign References **/
  @FieldResolver(returns => [BasicNoteInfo], {
    description: generateDescription('characters')
  })
  async allCharacters (@Root() adventure: Adventure, @Ctx() ctx: Context) {
    const chars = await ctx.characterService.getByAdventureId(adventure.id, { ignoreKnownBy: true })
    return toClass(chars, BasicNoteInfo)
  }

  @FieldResolver(returns => [BasicNoteInfo], {
    description: generateDescription('items')
  })
  async allItems (@Root() adventure: Adventure, @Ctx() ctx: Context) {
    const chars = await ctx.itemService.getByAdventureId(adventure.id, { ignoreKnownBy: true })
    return toClass(chars, BasicNoteInfo)
  }

  @FieldResolver(returns => [BasicNoteInfo], {
    description: generateDescription('locations')
  })
  async allLocations (@Root() adventure: Adventure, @Ctx() ctx: Context) {
    const chars = await ctx.locationService.getByAdventureId(adventure.id, { ignoreKnownBy: true })
    return toClass(chars, BasicNoteInfo)
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
    @Arg('characters', type => [ObjectIdScalar], { nullable: true }) characters: ObjectId[],
    @Arg('items', type => [ObjectIdScalar], { nullable: true }) items: ObjectId[],
    @Arg('locations', type => [ObjectIdScalar], { nullable: true }) locations: ObjectId[]
  ) {
    await Promise.all([
      ctx.characterService.addKnownBy(characters, nowKnownBy),
      ctx.itemService.addKnownBy(items, nowKnownBy),
      ctx.locationService.addKnownBy(locations, nowKnownBy)
    ])
    return true
  }
}
