/* eslint-disable no-unused-expressions */
/* global describe, it */
import { expect } from 'chai'
import { gql } from '../lib'

const CREATE_CHARACTER = `
mutation ($info:CharacterCreate!) {
  createCharacter (info:$info) {
    id
    name
    adventure {
      id
    }
    player {
      id
    }
    knownby {
      id
    }
  }
}
`

const LOG_IN_ADVENTURE = `
query ($adventure:ObjectId!) {
  loginToAdventure(adventure:$adventure) {
    token
  }
}
`

const LOG_IN_AS_CHARACTER = `
query ($character:ObjectId!) {
  loginAsCharacter(character:$character) {
    token
  }
}
`

const GET_CHARACTERS = `
query {
  characters {
    id
    name
  }
}
`

const TEACH_ABOUT = `
mutation ($characters:[ObjectId!]!, $nowKnownBy:[ObjectId!]!) {
  updateKnownBy (characters:$characters, nowKnownBy:$nowKnownBy)
}
`

const charsByName: any = {}
async function createPlayerCharacter (info: any, playerName: string, gmName: string) {
  info.playerEmail = `${playerName}@test.com`
  const { createCharacter: char } = await gql.getClient(gmName + '_gm').request(CREATE_CHARACTER, { info })
  expect(char.player.id).is.a('string')
  expect(char.adventure.id).is.a('string')
  expect(char.name).to.equal(info.name)
  expect(char.knownby.map((kb:any) => kb.id)).includes(char.id)
  charsByName[char.name] = char
  // create token logged in as character
  const { loginAsCharacter: { token } } = await gql.getClient(playerName).request(LOG_IN_AS_CHARACTER, { character: char.id })
  expect(token).to.be.a('string')
  gql.storeToken(char.name, token)
  // create token logged in as adventure
  const { loginToAdventure: { token: advtoken } } = await gql.getClient(playerName).request(LOG_IN_ADVENTURE, { adventure: char.adventure.id })
  expect(advtoken).to.be.a('string')
  gql.storeToken(`${playerName}_${gmName}`, advtoken)
  return char
}

async function createNPC (info: any, loggedInCharName: string, gmName: string) {
  const { createCharacter: char } = await gql.getClient(loggedInCharName).request(CREATE_CHARACTER, { info })
  expect(char.player).to.be.a('null')
  expect(char.adventure.id).to.be.a('string')
  charsByName[char.name] = char
  const { loginAsCharacter: { token } } = await gql.getClient(gmName).request(LOG_IN_AS_CHARACTER, { character: char.id })
  expect(token).to.be.a('string')
  gql.storeToken(char.name, token)
  return char
}

async function teachAbout (gmName: string, charNames: string[], nowKnownByNames: string[]) {
  const characters = charNames.map(nm => {
    return charsByName[nm].id
  })
  const nowKnownBy = nowKnownByNames.map(nm => charsByName[nm].id)
  await gql.getClient(gmName).request(TEACH_ABOUT, { characters, nowKnownBy })
}

describe('create characters', () => {
  const characters:any = {}
  it('should create 11 player characters', async () => {
    const chars = await Promise.all([
      // first adventure
      createPlayerCharacter({ name: 'Beta', alignment: { lawful: 'LAWFUL', good: 'GOOD' } }, 'beta', 'alpha'),
      createPlayerCharacter({ name: 'Andral', alignment: { lawful: 'NEUTRAL', good: 'GOOD' } }, 'john', 'alpha'),
      createPlayerCharacter({ name: 'Artus', alignment: { lawful: 'CHAOTIC', good: 'GOOD' } }, 'jenn', 'alpha'),
      createPlayerCharacter({ name: 'Aesop', alignment: { lawful: 'LAWFUL', good: 'NEUTRAL' } }, 'joe', 'alpha'),
      createPlayerCharacter({ name: 'Acron', alignment: { lawful: 'LAWFUL', good: 'UNKNOWN' } }, 'mike', 'alpha'),
      // second adventure
      createPlayerCharacter({ name: 'Crux', alignment: { lawful: 'NEUTRAL', good: 'EVIL' } }, 'nick', 'beta'),
      createPlayerCharacter({ name: 'Cruxtor', alignment: { lawful: 'NEUTRAL', good: 'GOOD' } }, 'nick', 'beta'),
      createPlayerCharacter({ name: 'Crater', alignment: { lawful: 'NEUTRAL', good: 'NEUTRAL' } }, 'nancy', 'beta'),
      createPlayerCharacter({ name: 'Castor', alignment: { lawful: 'CHAOTIC', good: 'EVIL' } }, 'nicole', 'beta'),
      createPlayerCharacter({ name: 'Cork', alignment: { lawful: 'UNKNOWN', good: 'UNKNOWN' } }, 'nate', 'beta'),
      createPlayerCharacter({ name: 'Cestus', alignment: { lawful: 'UNKNOWN', good: 'EVIL' } }, 'mike', 'beta')
    ])

    for (const char of chars) characters[char.name] = char
  })
  it('should create 12 NPCs', async () => {
    await Promise.all([
      // first adventure
      createNPC({ name: 'Yola', alignment: { lawful: 'CHAOTIC', good: 'NEUTRAL' } }, 'Beta', 'alpha'),
      createNPC({ name: 'Yelper', alignment: { lawful: 'CHAOTIC', good: 'NEUTRAL' } }, 'Andral', 'alpha'),
      createNPC({ name: 'Yak', alignment: { lawful: 'CHAOTIC', good: 'NEUTRAL' } }, 'Artus', 'alpha'),
      createNPC({ name: 'Yulia', alignment: { lawful: 'CHAOTIC', good: 'NEUTRAL' } }, 'Aesop', 'alpha'),
      createNPC({ name: 'Yandia', alignment: { lawful: 'CHAOTIC', good: 'NEUTRAL' } }, 'Acron', 'alpha'),
      // second adventure
      createNPC({ name: 'Zort', alignment: { lawful: 'CHAOTIC', good: 'NEUTRAL' } }, 'Crux', 'beta'),
      createNPC({ name: 'Zatar', alignment: { lawful: 'CHAOTIC', good: 'NEUTRAL' } }, 'Crater', 'beta'),
      createNPC({ name: 'Zulu', alignment: { lawful: 'CHAOTIC', good: 'NEUTRAL' } }, 'Castor', 'beta'),
      createNPC({ name: 'Zicky', alignment: { lawful: 'CHAOTIC', good: 'NEUTRAL' } }, 'Cork', 'beta'),
      createNPC({ name: 'Zenma', alignment: { lawful: 'CHAOTIC', good: 'NEUTRAL' } }, 'Cestus', 'beta')
    ])
  })
  it('should not allow players to log in to the wrong character', async () => {
    const promise = gql.getClient('john').request(LOG_IN_AS_CHARACTER, { character: characters.Artus.id })
    expect(promise).to.be.rejected
  })
  it('should be able to teach the PCs about each other', async () => {
    const { characters: charsCruxKnows } = await gql.getClient('Crux').request(GET_CHARACTERS)
    expect(charsCruxKnows).to.have.lengthOf(2)
    await Promise.all([
      teachAbout('alpha', ['Beta', 'Andral', 'Artus', 'Aesop', 'Acron'], ['Beta', 'Andral', 'Artus', 'Aesop', 'Acron']),
      teachAbout('beta', ['Crux', 'Cruxtor', 'Crater', 'Castor', 'Cork', 'Cestus'], ['Crux', 'Cruxtor', 'Crater', 'Castor', 'Cork', 'Cestus'])
    ])
    const { characters: charsCruxNowKnows } = await gql.getClient('Crux').request(GET_CHARACTERS)
    expect(charsCruxNowKnows).to.have.lengthOf(7)
  })
})
