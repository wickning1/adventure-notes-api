import { ObjectType, Field, FieldResolver, Root, Ctx, Resolver, InputType, Query, Arg, Mutation } from 'type-graphql'
import { ObjectId } from 'mongodb'
import { Context, ObjectIdScalar } from '../lib'
import { User } from '.'
import { withAlignment, withKnownByResolver, withKnownBy, withId, BaseUpdateInput, KnownByFilterInput, withOptionalAlignment, withAlignmentFilter, withName, withRequiredName, withOptionalName } from '../mixins'
import { ItemFilters, Item } from './item'

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class CharacterDetails {
  @Field({ nullable: true })
  player?: ObjectId
}

@ObjectType()
export class Character extends withName(withAlignment(withKnownBy(withId(CharacterDetails)))) {
  @Field({ nullable: true })
  invitation?: string
}

@InputType()
export class CharacterCreate extends withRequiredName(withOptionalAlignment(CharacterDetails)) {
  @Field({ nullable: true })
  playerEmail?: string
}

@InputType()
export class CharacterUpdate extends withOptionalName(withOptionalAlignment(BaseUpdateInput)) {
  @Field({ nullable: true })
  player?: ObjectId

  @Field({ nullable: true })
  playerEmail?: string
}

@InputType()
export class CharacterFilters extends withAlignmentFilter(KnownByFilterInput) {
  @Field({ nullable: true, description: 'When true, only return characters that have a player. When false, only return NPCs.' })
  isPlayerCharacter?: boolean

  @Field(type => [ObjectIdScalar], { nullable: true })
  player?: ObjectId[]
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

  @FieldResolver(returns => [Item])
  async items (@Root() character: Character, @Ctx() ctx: Context, @Arg('filter', { nullable: true }) filter?: ItemFilters) {
    return ctx.itemService.getByCharacterId(character.id, filter)
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
