import { ObjectType, registerEnumType, Field } from 'type-graphql'

export enum GoodType {
  GOOD = 1,
  NEUTRAL = 0,
  EVIL = -1
}
registerEnumType(GoodType, {
  name: 'GoodType',
  description: 'Whether this object tends toward good or evil or is neutral.'
})
export enum LawfulType {
  LAWFUL = 1,
  NEUTRAL = 0,
  CHAOTIC = -1
}
registerEnumType(LawfulType, {
  name: 'LawfulType',
  description: 'Whether this object tends toward lawful or chaotic or is neutral.'
})

@ObjectType()
export class Alignment {
  @Field()
  good!: GoodType

  @Field()
  lawful!: LawfulType
}
