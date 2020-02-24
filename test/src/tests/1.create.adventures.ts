/* global describe, it */
import { expect } from 'chai'
import { gql } from '../lib'

const CREATE_ADVENTURE = `
mutation ($name:String!) {
  createAdventure (info:{
    name:$name
  }) {
    id
    gamemaster {
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

async function createAdventure (userName: string, name: string) {
  const { createAdventure: adventure } = await gql.getClient(userName).request(CREATE_ADVENTURE, { name })
  expect(adventure.id).to.be.a('string')
  const result = await gql.getClient(userName).request(LOG_IN_ADVENTURE, { adventure: adventure.id })
  const token = result.loginToAdventure.token
  expect(token).to.be.a('string')
  gql.storeToken(`${userName}_gm`, token)
  return adventure
}

describe('create adventures', () => {
  it('should create 2 adventures', async () => {
    const [alpha, beta] = await Promise.all([
      createAdventure('alpha', 'Alpha Crew'),
      createAdventure('beta', 'Beta Crew')
    ])
    expect(alpha.gamemaster.id).to.not.equal(beta.gamemaster.id)
  })
})
