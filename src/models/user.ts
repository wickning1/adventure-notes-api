import { ObjectType, InputType, Field, Resolver, FieldResolver, Root, Ctx, Query, Mutation, Arg } from 'type-graphql'
import { withId } from '../mixins'
import { Ref, Context } from '../lib'
import { Character } from './character'

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class UserDetails {
  @Field()
  name!: string

  @Field()
  email!: string
}

@ObjectType()
export class User extends withId(UserDetails) {
  @Field(type => [Character])
  characters!: Ref<Character[]>
}

@InputType()
export class UserInput extends UserDetails {
  @Field()
  password?: string
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
  async users (@Ctx() ctx: Context) {
    return ctx.userService.getMany()
  }

  @FieldResolver(returns => [Character])
  async characters (@Root() user: User, @Ctx() ctx: Context): Promise<Character[]> {
    return []
  }

  @Mutation(returns => User)
  async createUser (@Arg('user') userData: UserInput, @Ctx() ctx: Context) {
    return ctx.userService.create(userData)
  }

  @Mutation(returns => JWT)
  async login (@Arg('email') email: string, @Arg('password') password: string, @Ctx() ctx: Context) {
    const user = await ctx.userService.checkLogin(email, password)
    if (!user) throw new Error('Authentication failed.')
    const token = ctx.getToken({ user: user.id })
    return { token }
  }
}
