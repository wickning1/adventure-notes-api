import { ObjectType, Field, FieldResolver, Root, Ctx, Resolver, InputType, Query, Arg, Mutation } from 'type-graphql'
import { ObjectId } from 'mongodb'
import { Context } from '../lib'
import { User } from '.'
import { withAlignment, withKnownByResolver, withKnownBy, withId, BaseUpdateInput, KnownByFilterInput } from '../mixins'

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class CharacterDetails {
  @Field()
  name!: string

  @Field({ nullable: true })
  player?: ObjectId
}

@ObjectType()
export class Character extends withAlignment(withKnownBy(withId(CharacterDetails))) {
  @Field(type => [String])
  aliases!: string[]

  @Field({ nullable: true })
  invitation?: string
}

@InputType()
export class CharacterCreate extends withAlignment(CharacterDetails) {
  @Field({ nullable: true })
  playerEmail?: string

  @Field(type => [String], { nullable: true })
  aliases?: string[]
}

@InputType()
export class CharacterUpdate extends withAlignment(BaseUpdateInput) {
  @Field({ nullable: true })
  name?: string

  @Field(type => [String], { nullable: true })
  aliases?: string[]

  @Field({ nullable: true })
  playerEmail?: string
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
