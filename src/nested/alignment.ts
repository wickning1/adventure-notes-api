import { ObjectType, registerEnumType, Field } from 'type-graphql'

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
export class Alignment {
  @Field(type => GoodType)
  good!: GoodType

  @Field(type => LawfulType)
  lawful!: LawfulType

  @Field(type => String, { description: 'The full alignment description, e.g. "Lawful Good", "Chaotic Unknown", "Neutral", or "Unknown"' })
  get description () {
    if (this.good.toString() === this.lawful.toString()) return this.good.toString()
    return `${this.lawful.toString()} ${this.good.toString()}`
  }
}
