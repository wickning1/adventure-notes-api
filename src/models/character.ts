import { ObjectType, Field, FieldResolver, Root, Ctx, Resolver, InputType, Query, Arg, Mutation } from 'type-graphql'
import { ObjectId } from 'mongodb'
import { Context } from '../lib'
import { Alignment, AlignmentDetails } from '../nested'
import { User } from '.'
import { withKnownByResolver, withKnownBy, withId, BaseUpdateInput, KnownByFilterInput } from '../mixins'

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class CharacterDetails {
  @Field()
  name!: string

  @Field(type => [String])
  aliases!: string[]

  @Field({ nullable: true })
  player?: ObjectId
}

@ObjectType()
export class Character extends withKnownBy(withId(CharacterDetails)) {
  @Field()
  alignment!: Alignment
}

@InputType()
export class CharacterCreate extends CharacterDetails {
  @Field({ nullable: true })
  alignment!: AlignmentDetails
}

@InputType()
export class CharacterUpdate extends BaseUpdateInput {
  @Field({ nullable: true })
  name?: string

  @Field(type => [String], { nullable: true })
  aliases?: string[]

  @Field({ nullable: true })
  alignment?: AlignmentDetails

  @Field({ nullable: true })
  player?: ObjectId
}

@InputType()
export class CharacterFilters extends KnownByFilterInput {
  @Field({ nullable: true, description: 'When true, query only returns characters for which the user is permitted to use the "Point of View" feature.' })
  mayLoginAs?: boolean

  @Field({ nullable: true, description: 'When true, only return characters that have a player. When false, only return NPCs.' })
  isPlayerCharacter?: boolean
}

@Resolver(of => Character)
export class CharacterResolver extends withKnownByResolver(Character, Object) {
  @Query(returns => [Character])
  async characters (@Ctx() ctx: Context, @Arg('filter', { nullable: true }) filter?: CharacterFilters) {
    return ctx.characterService.getFiltered(filter)
  }

  @FieldResolver(returns => User, { nullable: true })
  async player (@Root() character: Character, @Ctx() ctx: Context) {
    return ctx.userService.get(character.player)
  }

  @Mutation(returns => Character)
  async createCharacter (@Arg('info') info: CharacterCreate, @Ctx() ctx: Context) {
    return ctx.characterService.create(info)
  }

  @Mutation(returns => Character)
  async updateCharacter (@Arg('info') info: CharacterUpdate, @Ctx() ctx: Context) {
    return ctx.characterService.save(info)
  }
}
