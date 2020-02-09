import crypto from 'crypto'

export function toArray<ItemType> (items: ItemType | ItemType[]) {
  return Array.isArray(items) ? items : [items]
}

export function toClass<ItemType> (items: any[], ObjectClass: { new(): ItemType }): ItemType[]
export function toClass<ItemType> (items: any, ObjectClass: { new(): ItemType }): ItemType
export function toClass<ItemType> (items: any, ObjectClass: { new(): ItemType }): any {
  if (Array.isArray(items)) {
    return items.map(item => toClass(item, ObjectClass))
  } else {
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
