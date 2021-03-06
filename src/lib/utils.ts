import crypto from 'crypto'
import { ClassType } from 'type-graphql'
import { GraphQLResolveInfo } from 'graphql'

export function toArray<ItemType> (items?: ItemType | ItemType[]): ItemType[] {
  if (!items) return []
  return Array.isArray(items) ? items : [items]
}

export function toClass<ItemType> (items: any[], ObjectClass: ClassType<ItemType>): ItemType[]
export function toClass<ItemType> (items: any, ObjectClass: ClassType<ItemType>): ItemType | undefined
export function toClass<ItemType> (items: any, ObjectClass: ClassType<ItemType>): any {
  if (Array.isArray(items)) {
    return items.map(item => toClass(item, ObjectClass))
  } else {
    if (!items) return undefined
    if (items instanceof ObjectClass) return items
    const ret = new ObjectClass()
    Object.assign(ret, items)
    return ret
  }
}

export function saltAndHash (secret: string) {
  const salt = crypto.randomBytes(8).toString('base64')
  const hasher = crypto.createHash('sha256')
  hasher.write(secret + salt)
  return { hash: hasher.digest('base64'), salt }
}

export function checkSaltedHash (secret: string, hash: string, salt: string) {
  const hasher = crypto.createHash('sha256')
  hasher.write(secret + salt)
  return hasher.digest('base64') === hash
}

export function andFilters (filters:any[]) {
  if (filters?.length > 1) return { $and: filters }
  if (filters?.length) return filters[0]
  return {}
}

export function randomString () {
  return crypto.randomBytes(16).toString('hex')
}

export function onlyResolveId (info?: GraphQLResolveInfo) {
  const selections = info?.fieldNodes[0].selectionSet?.selections
  return (selections?.length === 1 && info?.fieldName === 'id')
}

export function push<ItemType = any> (array:ItemType[], ...items:ItemType[]) {
  if (!array?.length) array = []
  array.push(...items)
  return array
}
