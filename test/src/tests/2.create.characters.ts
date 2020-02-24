/* global describe, it */
import { expect } from 'chai'
import { gql } from '../lib'

const CREATE_CHARACTER = `
mutation ($info:CharacterCreate!) {
  createCharacter (info:$info) {
    id
    player {
      id
    }
  }
}
`
/*
const LOG_IN_AS_CHARACTER = `

`
*/
async function createCharacter (info: any, playerName: string, gmName: string) {
  info.playerEmail = `${playerName}@test.com`
  const { createCharacter: char } = await gql.getClient(gmName + '_gm').request(CREATE_CHARACTER, { info })
  expect(char.player.id).is.a('string')
}

describe('create characters', () => {
  it('should create 11 player characters', async () => {
    await Promise.all([
      // first adventure
      createCharacter({ name: 'Beta', alignment: { lawful: 'LAWFUL', good: 'GOOD' } }, 'beta', 'alpha'),
      createCharacter({ name: 'Andral', alignment: { lawful: 'NEUTRAL', good: 'GOOD' } }, 'john', 'alpha'),
      createCharacter({ name: 'Artus', alignment: { lawful: 'CHAOTIC', good: 'GOOD' } }, 'jenn', 'alpha'),
      createCharacter({ name: 'Aesop', alignment: { lawful: 'LAWFUL', good: 'NEUTRAL' } }, 'joe', 'alpha'),
      createCharacter({ name: 'Malor', alignment: { lawful: 'LAWFUL', good: 'UNKNOWN' } }, 'mike', 'alpha'),
      // second adventure
      createCharacter({ name: 'Crux', alignment: { lawful: 'NEUTRAL', good: 'EVIL' } }, 'nick', 'beta'),
      createCharacter({ name: 'Crater', alignment: { lawful: 'NEUTRAL', good: 'NEUTRAL' } }, 'nancy', 'beta'),
      createCharacter({ name: 'Castor', alignment: { lawful: 'CHAOTIC', good: 'EVIL' } }, 'nicole', 'beta'),
      createCharacter({ name: 'Cestus', alignment: { lawful: 'UNKNOWN', good: 'EVIL' } }, 'mike', 'beta'),
      createCharacter({ name: 'Cork', alignment: { lawful: 'UNKNOWN', good: 'UNKNOWN' } }, 'nate', 'beta'),
      createCharacter({ name: 'Mito', alignment: { lawful: 'LAWFUL', good: 'EVIL' } }, 'joe', 'beta')
    ])
  })
})
