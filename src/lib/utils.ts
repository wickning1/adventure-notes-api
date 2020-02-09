export function toArray<ItemType> (items: ItemType | ItemType[]) {
  return Array.isArray(items) ? items : [items]
}
