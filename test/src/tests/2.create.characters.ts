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

async function createCharacter (info: any, playerName: string, gmName: string) {
  info.playerEmail = `${playerName}@test.com`
  const { createCharacter: char } = await gql.getClient(gmName + '_gm').request(CREATE_CHARACTER, { info })
  expect(char.player.id).is.a('string')
}

describe('create characters', () => {
  it('should create 9 characters', async () => {
    await Promise.all([
      createCharacter({ name: 'Beta', alignment: { lawful: 'LAWFUL', good: 'GOOD' } }, 'beta', 'alpha')
    ])
  })
})
