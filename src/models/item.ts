import { GraphQLResolveInfo } from 'graphql'
import { ObjectId } from 'mongodb'
import { ObjectType, Field, FieldResolver, Root, Ctx, Resolver, InputType, Query, Arg, Mutation, Info } from 'type-graphql'
import { Context, ObjectIdScalar } from '../lib'
import { Character } from '.'
import { withAlignment, withKnownByResolver, withKnownBy, withId, BaseUpdateInput, KnownByFilterInput, withOptionalAlignment, withName, withRequiredName, withOptionalName } from '../mixins'

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class ItemDetails {
  @Field({ nullable: true })
  description?: string

  @Field({ nullable: true })
  heldBy?: ObjectId
}

@ObjectType()
export class Item extends withName(withAlignment(withKnownBy(withId(ItemDetails)))) {
}

@InputType()
export class ItemCreate extends withRequiredName(withOptionalAlignment(ItemDetails)) {
}

@InputType()
export class ItemUpdate extends withOptionalName(withOptionalAlignment(BaseUpdateInput)) {
  @Field({ nullable: true })
  description?: string
}

@InputType()
export class ItemFilters extends KnownByFilterInput {
  @Field({ nullable: true })
  isHeld?: boolean

  @Field(type => [ObjectIdScalar], { nullable: true })
  heldBy?: ObjectId[]
}

@Resolver(of => Item)
export class ItemResolver extends withKnownByResolver(Item, Object) {
  @Query(returns => [Item])
  async items (@Ctx() ctx: Context, @Arg('filter', { nullable: true }) filter?: ItemFilters) {
    return ctx.itemService.getFiltered(filter)
  }

  @FieldResolver(returns => Character, { nullable: true })
  async heldBy (@Root() item: Item, @Ctx() ctx: Context, @Info() info: GraphQLResolveInfo) {
    return ctx.characterService.get(item.heldBy, info)
  }

  @Mutation(returns => Item)
  async createItem (@Arg('info') info: ItemCreate, @Ctx() ctx: Context) {
    return ctx.itemService.create(info)
  }

  @Mutation(returns => Item)
  async updateItem (@Arg('info') info: ItemUpdate, @Ctx() ctx: Context) {
    return ctx.itemService.save(info)
  }
}
