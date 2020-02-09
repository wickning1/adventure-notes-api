import { ObjectType, InputType, Field, Resolver, FieldResolver, Root, Ctx, Query } from 'type-graphql'
import { withId } from '../mixins'
import { Ref, Context } from '../lib'
import { Character } from './character'

@ObjectType({ isAbstract: true })
@InputType('UserDetailsInput', { isAbstract: true })
export class UserDetails {
  @Field()
  email!: string
}

@ObjectType()
export class User extends withId(UserDetails) {
  @Field(type => [Character])
  characters!: Ref<Character[]>
}

@InputType('CreateUserInput')
export class CreateUserInput extends UserDetails {
  @Field()
  password!: string
}

@Resolver(of => User)
export class UserResolver {
  @Query(returns => User)
  async self () {
    return new User()
  }

  @FieldResolver(returns => [Character])
  async characters (@Root() user: User, @Ctx() ctx: Context): Promise<Character[]> {
    return []
  }
}
