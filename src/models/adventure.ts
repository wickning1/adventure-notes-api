import { ObjectType, Field, Int, Resolver, Query, Arg, FieldResolver, InputType, Mutation, Ctx } from 'type-graphql'
import { Ref, ObjectIdScalar, Context } from '../lib'
import { Character, User } from '.'
import { withId, BaseUpdateInput } from '../mixins'
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
  dm!: Ref<User>
}

@InputType()
export class AdventureUpdate extends BaseUpdateInput {
  @Field()
  name?: string

  @Field(type => Int)
  day?: number

  @Field()
  dm?: ObjectId
}

@Resolver(of => Adventure)
export class AdventureResolver {
  @Query(returns => [Adventure])
  async adventures (@Arg('ids', type => [ObjectIdScalar]) ids: ObjectId[]): Promise<Adventure[]> {
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

  @Mutation(returns => Adventure)
  async updateAdventure (@Arg('info') info: AdventureUpdate, @Ctx() ctx: Context) {
    return ctx.adventureService.update(info)
  }
}
