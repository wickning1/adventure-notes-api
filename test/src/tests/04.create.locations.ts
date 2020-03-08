/* global describe, it */
import { expect } from 'chai'
import { gql, storage } from '../lib'

const CREATE_LOCATION = `
mutation ($info:LocationCreate!) {
  createLocation (info:$info) {
    id
    name
    adventure {
      id
    }
    inside {
      id
    }
    knownby {
      id
    }
  }
}
`

const GET_LOCATIONS = 'query { locations { id, name } }'

const TEACH_ABOUT = `
mutation ($locations:[ObjectId!]!, $nowKnownBy:[ObjectId!]!) {
  updateKnownBy (locations:$locations, nowKnownBy:$nowKnownBy)
}
`

storage.locationsByName = {}
async function createLocation (info: any, loggedInCharName: string) {
  const { createLocation: location } = await gql.getClient(loggedInCharName).request(CREATE_LOCATION, { info })
  expect(location.adventure.id).to.be.a('string')
  storage.locationsByName[location.name] = location
  return location
}

async function teachAbout (gmName: string, locationNames: string[], nowKnownByNames: string[]) {
  const locations = locationNames.map(nm => storage.locationsByName[nm].id)
  const nowKnownBy = nowKnownByNames.map(nm => storage.charsByName[nm].id)
  await gql.getClient(gmName).request(TEACH_ABOUT, { locations, nowKnownBy })
}

describe('create locations', () => {
  it('should create 4 locations per adventure, all nested in second adventure', async () => {
    await Promise.all([
      // first adventure
      createLocation({ name: 'Countryside', alignment: { lawful: 'LAWFUL', good: 'GOOD' } }, 'Andral'),
      createLocation({ name: 'City', aliases: [] }, 'Acron'),
      createLocation({ name: 'Forest', aliases: ['Woodlands', 'Treelands'] }, 'Aesop'),
      // second adventure
      createLocation({ name: 'Undersea' }, 'Crater')
    ])
    await Promise.all([
      // first adventure
      createLocation({ name: 'Suburb', inside: storage.locationsByName.City.id, homestead: true }, 'Acron'),
      // second adventure
      createLocation({ name: 'UnderseaCity', inside: storage.locationsByName.Undersea.id }, 'Crater')
    ])
    await createLocation({ name: 'UnderseaSuburb', inside: storage.locationsByName.UnderseaCity.id }, 'Crater')
    await createLocation({ name: 'UnderseaNeighborhood', inside: storage.locationsByName.UnderseaSuburb.id, homestead: true }, 'Crater')
  })
  it('should not allow Beta to create something inside City because Beta does not know about City', async () => {
    const promise = gql.getClient('Beta').request(CREATE_LOCATION, { info: { name: 'AnotherSuburb', inside: storage.locationsByName.City.id } })
    expect(promise).to.be.rejected
    try {
      await promise
    } catch (e) {
      expect(e.response.errors.find((e:any) => e.extensions?.invalidArgs).extensions.invalidArgs.some((arg:any) => arg.field === 'inside')).to.be.true
    }
  })
  it('should be able to teach the PCs about the party homestead locations', async () => {
    const { locations: locationsCastorKnows } = await gql.getClient('Castor').request(GET_LOCATIONS)
    expect(locationsCastorKnows).to.have.lengthOf(0)
    await Promise.all([
      teachAbout('alpha', ['Suburb'], ['Beta', 'Andral', 'Artus', 'Aesop', 'Acron']),
      teachAbout('beta', ['UnderseaNeighborhood'], ['Crux', 'Cruxtor', 'Crater', 'Castor', 'Cork', 'Cestus'])
    ])
    const { locations: locationsCastorNowKnows } = await gql.getClient('Castor').request(GET_LOCATIONS)
    expect(locationsCastorNowKnows).to.have.lengthOf(4)
    const { locations: locationsAndralNowKnows } = await gql.getClient('Andral').request(GET_LOCATIONS)
    expect(locationsAndralNowKnows).to.have.lengthOf(3)
  })
  it('should be able to retrieve a list of homesteads', async () => {
    const { locations: homesteads } = await gql.getClient('alpha').request('{ locations (filter:{homestead:true}) { id, name } }')
    expect(homesteads).to.have.lengthOf(1)
    const { locations: notHomesteads } = await gql.getClient('alpha').request('{ locations (filter:{homestead:false}) { id, name } }')
    expect(notHomesteads).to.have.lengthOf(3)
  })
})
