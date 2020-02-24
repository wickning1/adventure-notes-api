/* global describe, it */
import { expect } from 'chai'
import { gql } from '../lib'

const CREATE_USER = `
mutation ($name: String!, $email: String!, $password: String!){
  createUser (info:{
    name:$name
    email:$email
    password:$password
  }) {
    id
  }
}
`

const LOG_IN = `
query ($email: String!, $password: String!){
  login(email:$email, password:$password) {
    token
  }
}
`

async function createUser (name: string, email: string, password: string) {
  const data = await gql.unauthenticated.request(CREATE_USER, { name, email, password })
  expect(data?.createUser?.id).to.not.be.an('undefined')
}

async function logIn (name: string) {
  const { login: { token } } = await gql.unauthenticated.request(LOG_IN, {
    email: `${name}@test.com`,
    password: `${name}rocks`
  })
  expect(token).to.be.a('string')
  gql.storeToken(name, token)
}

describe('create users', () => {
  it('should create 10 users', async () => {
    await Promise.all([
      // First GM
      createUser('AlphaDog', 'alpha@test.com', 'alpharocks'),
      // Second GM, also a player in the first game
      createUser('BetaMax', 'beta@test.com', 'betarocks'),
      // Plays in both campaigns
      createUser('Mike', 'mike@test.com', 'mikerocks'),
      // Plays in first campaign
      createUser('John', 'john@test.com', 'johnrocks'),
      createUser('Jenn', 'jenn@test.com', 'jennrocks'),
      createUser('Joe', 'joe@test.com', 'joerocks'),
      // Plays in second campaign
      createUser('Nick', 'nick@test.com', 'nickrocks'),
      createUser('Nancy', 'nancy@test.com', 'nancyrocks'),
      createUser('Nicole', 'nicole@test.com', 'nicolerocks'),
      createUser('Nate', 'nate@test.com', 'naterocks')
    ])
  })

  it('should be able to log in as each of the 10 users and store their tokens for later', async () => {
    await Promise.all([
      logIn('alpha'),
      logIn('beta'),
      logIn('mike'),
      logIn('john'),
      logIn('jenn'),
      logIn('joe'),
      logIn('nick'),
      logIn('nancy'),
      logIn('nicole'),
      logIn('nate')
    ])
  })
})
