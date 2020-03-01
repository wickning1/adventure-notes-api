import { GraphQLResolveInfo } from 'graphql'
import { ObjectId } from 'mongodb'
import { ObjectType, Field, FieldResolver, Root, Ctx, Resolver, InputType, Query, Arg, Mutation, Info } from 'type-graphql'
import { Context, ObjectIdScalar } from '../lib'
import { withAlignment, withKnownByResolver, withKnownBy, withId, BaseUpdateInput, KnownByFilterInput, withInputName, withName } from '../mixins'

@ObjectType({ isAbstract: true })
@InputType({ isAbstract: true })
export class LocationDetails {
  @Field({ nullable: true })
  description?: string

  @Field({ nullable: true })
  inside?: ObjectId
}

@ObjectType()
export class Location extends withName(withAlignment(withKnownBy(withId(LocationDetails)))) {
}

@InputType()
export class LocationCreate extends withInputName(withAlignment(LocationDetails)) {
}

@InputType()
export class LocationUpdate extends withInputName(withAlignment(BaseUpdateInput)) {
  @Field({ nullable: true })
  description?: string
}

@InputType()
export class LocationFilters extends KnownByFilterInput {
  @Field({ nullable: true })
  isInsideAnother?: boolean

  @Field(type => [ObjectIdScalar], { nullable: true })
  inside?: ObjectId[]
}

@Resolver(of => Location)
export class LocationResolver extends withKnownByResolver(Location, Object) {
  @Query(returns => [Location])
  async locations (@Ctx() ctx: Context, @Arg('filter', { nullable: true }) filter?: LocationFilters) {
    return ctx.locationService.getFiltered(filter)
  }

  @FieldResolver(returns => Location, { nullable: true })
  async inside (@Root() item: Location, @Ctx() ctx: Context, @Info() info: GraphQLResolveInfo) {
    return ctx.locationService.get(item.inside, info)
  }

  @FieldResolver(returns => [Location])
  async childLocations (@Root() item: Location, @Ctx() ctx: Context, @Arg('filter', { nullable: true }) filter?: LocationFilters) {
    return ctx.locationService.getByParentId(item.id, filter)
  }

  @Mutation(returns => Location)
  async createLocation (@Arg('info') info: LocationCreate, @Ctx() ctx: Context) {
    return ctx.locationService.create(info)
  }

  @Mutation(returns => Location)
  async updateLocation (@Arg('info') info: LocationUpdate, @Ctx() ctx: Context) {
    return ctx.locationService.save(info)
  }
}
