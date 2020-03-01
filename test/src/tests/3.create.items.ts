/* global describe, it */
import { expect } from 'chai'
import { gql, storage } from '../lib'

const CREATE_ITEM = `
mutation ($info:ItemCreate!) {
  createItem (info:$info) {
    id
    name
    adventure {
      id
    }
    heldBy {
      id
    }
    knownby {
      id
    }
  }
}
`

const GET_ITEMS = `
query {
  items {
    id
    name
  }
}
`

const TEACH_ABOUT = `
mutation ($items:[ObjectId!]!, $nowKnownBy:[ObjectId!]!) {
  updateKnownBy (items:$items, nowKnownBy:$nowKnownBy)
}
`

storage.itemsByName = {}
async function createItem (info: any, loggedInCharName: string) {
  const { createItem: item } = await gql.getClient(loggedInCharName).request(CREATE_ITEM, { info })
  expect(item.adventure.id).to.be.a('string')
  storage.itemsByName[item.name] = item
  return item
}

async function teachAbout (gmName: string, itemNames: string[], nowKnownByNames: string[]) {
  const items = itemNames.map(nm => storage.itemsByName[nm].id)
  const nowKnownBy = nowKnownByNames.map(nm => storage.charsByName[nm].id)
  await gql.getClient(gmName).request(TEACH_ABOUT, { items, nowKnownBy })
}

describe('create items', () => {
  it('should create 3 items per adventure', async () => {
    await Promise.all([
      // first adventure
      createItem({ name: 'Hammer', alignment: { lawful: 'LAWFUL', good: 'GOOD' } }, 'Andral'),
      createItem({ name: 'Axe' }, 'Acron'),
      createItem({ name: 'Sword', heldBy: storage.charsByName.Aesop.id, alignment: { lawful: 'UNKNOWN', good: 'UNKNOWN' } }, 'Aesop'),
      // second adventure
      createItem({ name: 'Dagger' }, 'Crater'),
      createItem({ name: 'Staff', alignment: { lawful: 'CHAOTIC', good: 'GOOD' } }, 'Castor'),
      createItem({ name: 'Lute', heldBy: storage.charsByName.Cork.id, alignment: { lawful: 'NEUTRAL', good: 'NEUTRAL' } }, 'Crux')
    ])
  })
  it('should have set Cork as being able to see his Lute, even though Crux created it', async () => {
    const { items: itemsCorkSees } = await gql.getClient('Cork').request(GET_ITEMS)
    expect(itemsCorkSees.some((itm:any) => itm.name === 'Lute')).to.be.true
  })
  it('should be able to teach the PCs about the party-equipped items', async () => {
    const { items: itemsAndralKnows } = await gql.getClient('Andral').request(GET_ITEMS)
    expect(itemsAndralKnows).to.have.lengthOf(1)
    await Promise.all([
      teachAbout('alpha', ['Sword'], ['Beta', 'Andral', 'Artus', 'Aesop', 'Acron']),
      teachAbout('beta', ['Lute'], ['Crux', 'Cruxtor', 'Crater', 'Castor', 'Cork', 'Cestus'])
    ])
    const { items: itemsAndralNowKnows } = await gql.getClient('Andral').request(GET_ITEMS)
    expect(itemsAndralNowKnows).to.have.lengthOf(2)
  })
})
