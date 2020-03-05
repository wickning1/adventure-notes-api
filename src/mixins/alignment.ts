import { ClassType, InputType, ObjectType, Field, registerEnumType, Resolver, Root, FieldResolver } from 'type-graphql'
import { BaseService, ServiceMixinHelper } from '../services'

export enum GoodType {
  GOOD = 'Good',
  NEUTRAL = 'Neutral',
  EVIL = 'Evil',
  UNKNOWN = 'Unknown'
}
registerEnumType(GoodType, {
  name: 'GoodType',
  description: 'Whether this object tends toward good or evil or is neutral.'
})
export enum LawfulType {
  LAWFUL = 'Lawful',
  NEUTRAL = 'Neutral',
  CHAOTIC = 'Chaotic',
  UNKNOWN = 'Unknown'
}
registerEnumType(LawfulType, {
  name: 'LawfulType',
  description: 'Whether this object tends toward lawful or chaotic or is neutral.'
})

@ObjectType()
@InputType('AlignmentInput')
export class Alignment {
  @Field(type => GoodType)
  good!: GoodType

  @Field(type => LawfulType)
  lawful!: LawfulType
}

@Resolver(of => Alignment)
export class AlignmentResolver {
  @FieldResolver(returns => String, { description: 'The full alignment description, e.g. "Lawful Good", "Chaotic Unknown", "Neutral", or "Unknown"' })
  description (@Root() alignment: Alignment) {
    if (alignment.good.toString() === alignment.lawful.toString()) return alignment.good.toString()
    return `${alignment.lawful.toString()} ${alignment.good.toString()}`
  }
}

export function withAlignment<T extends ClassType> (NextMixinClass: T) {
  @ObjectType({ isAbstract: true })
  class AlignmentTrait extends NextMixinClass {
    @Field()
    alignment: Alignment = { lawful: LawfulType.UNKNOWN, good: GoodType.UNKNOWN }
  }
  return AlignmentTrait
}

export function withOptionalAlignment<T extends ClassType> (NextMixinClass: T) {
  @InputType({ isAbstract: true })
  class AlignmentTrait extends NextMixinClass {
    @Field({ nullable: true })
    alignment?: Alignment
  }
  return AlignmentTrait
}

export function withAlignmentFilter<T extends ClassType> (NextMixinClass: T) {
  @InputType({ isAbstract: true })
  class AlignmentInput extends NextMixinClass {
    @Field(type => [LawfulType], { nullable: true })
    lawfulTypes?: LawfulType[]

    @Field(type => [GoodType], { nullable: true })
    goodTypes?: GoodType[]
  }
  return AlignmentInput
}

export class AlignmentServiceHelper extends ServiceMixinHelper {
  static async onStartup (service: typeof BaseService) {
    await service.createIndex('alignment.lawfulType')
    await service.createIndex('alignment.goodType')
  }
}
