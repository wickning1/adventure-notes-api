export function toArray<ItemType> (items: ItemType | ItemType[]) {
  return Array.isArray(items) ? items : [items]
}

export function toClass<ItemType> (items: any[], ObjectClass: { new(): ItemType }) {
  return items.map(item => {
    const ret = new ObjectClass()
    Object.assign(ret, item)
    return ret
  })
}
