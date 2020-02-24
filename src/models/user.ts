import { ObjectType, InputType, Field, Resolver, FieldResolver, Root, Ctx, Query, Mutation, Arg, UnauthorizedError } from 'type-graphql'
import { ApolloError } from 'apollo-server'
import { ObjectId } from 'mongodb'
import { withId, BaseUpdateInput, BaseFilterInput } from '../mixins'
import { Context } from '../lib'
import { Adventure, Character } from '.'

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class UserDetails {
  @Field()
  name!: string

  @Field({ nullable: true })
  email?: string
}

@ObjectType()
export class User extends withId(UserDetails) {
  @Field(type => [Character])
  characters!: ObjectId[]
}

@InputType()
export class UserInput extends UserDetails {
  @Field()
  password!: string
}

@InputType()
export class UserUpdate extends BaseUpdateInput {
  @Field({ nullable: true })
  name?: string

  @Field({ nullable: true })
  email?: string

  @Field({ nullable: true })
  password?: string
}

@InputType()
export class UserFilter extends BaseFilterInput {

}

@ObjectType()
export class JWT {
  @Field()
  token!: string
}

@Resolver(of => User)
export class UserResolver {
  @Query(returns => User)
  async self (@Ctx() ctx: Context) {
    if (!ctx.user) throw new Error('You must authenticate before retrieving self.')
    return ctx.userService.get(ctx.user)
  }

  @Query(returns => [User])
  async users (@Ctx() ctx: Context, @Arg('filter', { nullable: true }) filter?: UserFilter) {
    return ctx.userService.getFiltered(filter)
  }

  @FieldResolver(returns => [Character])
  async characters (@Root() user: User, @Ctx() ctx: Context): Promise<Character[]> {
    return ctx.characterService.getByPlayerId(user.id)
  }

  @FieldResolver(returns => [Adventure])
  async dmForAdventures (@Root() user: User, @Ctx() ctx: Context) {
    return ctx.adventureService.getByGmId(user.id)
  }

  @Mutation(returns => User)
  async createUser (@Arg('info') userData: UserInput, @Ctx() ctx: Context) {
    return ctx.userService.create(userData)
  }

  @Mutation(returns => User)
  async updateUser (@Arg('info') userData: UserUpdate, @Ctx() ctx: Context) {
    return ctx.userService.save(userData)
  }

  @Query(returns => JWT)
  async login (@Arg('email') email: string, @Arg('password') password: string, @Ctx() ctx: Context) {
    const userid = await ctx.userService.checkLogin(email, password)
    if (!userid) throw new ApolloError('Email and password could not be verified.', 'AUTHENTICATION_FAILURE')
    const token = ctx.getToken({ user: userid })
    return { token }
  }

  @Query(returns => JWT, {
    description: 'Log in as a specific character. Must already be logged in as a user.'
  })
  async loginAsCharacter (
    @Ctx() ctx: Context,
    @Arg('character') characterId: ObjectId
  ) {
    const characters = await ctx.characterService.mayLoginAs()
    const character = characters.find(c => c.id.equals(characterId.toHexString()))
    if (!character) throw new UnauthorizedError()
    const token = ctx.getToken({ user: ctx.user!, adventure: character.adventure, character: character.id })
    return { token }
  }

  @Query(returns => JWT, {
    description: 'Log in to an adventure but not as a specific character. Must already be logged in as a user.'
  })
  async loginToAdventure (
    @Ctx() ctx: Context,
    @Arg('adventure') adventureId: ObjectId
  ) {
    const adventures = await ctx.getAdventures()
    if (!adventures.some(a => a.id.equals(adventureId))) throw new UnauthorizedError()
    const token = ctx.getToken({ user: ctx.user!, adventure: adventureId })
    return { token }
  }
}
