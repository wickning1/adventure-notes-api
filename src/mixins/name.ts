import { ClassType, ObjectType, InputType, Field } from 'type-graphql'
import { ServiceMixinHelper, BaseService } from '../services'

export function withName<T extends ClassType> (NextMixinClass: T) {
  @ObjectType({ isAbstract: true })
  class AliasTrait extends NextMixinClass {
    @Field()
    name!: string

    @Field(type => [String])
    aliases: string[] = []
  }
  return AliasTrait
}

export function withInputName<T extends ClassType> (NextMixinClass: T) {
  @InputType({ isAbstract: true })
  class AliasTrait extends NextMixinClass {
    @Field()
    name!: string

    @Field(type => [String], { nullable: true })
    aliases?: string[]
  }
  return AliasTrait
}

export class NameServiceHelper extends ServiceMixinHelper {
  static async onStartup (service: typeof BaseService) {
    await service.createIndex('name', { unique: true })
    await service.createIndex('aliases', { sparse: true })
  }
}
