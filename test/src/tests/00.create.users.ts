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

async function createUser (name: string, login: string) {
  const data = await gql.unauthenticated.request(CREATE_USER, { name, email: `${login}@test.com`, password: `${login}rocks` })
  expect(data?.createUser?.id).to.not.be.an('undefined')
}

async function logIn (login: string) {
  const { login: { token } } = await gql.unauthenticated.request(LOG_IN, {
    email: `${login}@test.com`,
    password: `${login}rocks`
  })
  expect(token).to.be.a('string')
  gql.storeToken(login, token)
}

describe('create users', () => {
  it('should create 10 users', async () => {
    await Promise.all([
      // First GM
      createUser('AlphaDog', 'alpha'),
      // Second GM, also a player in the first game
      createUser('BetaMax', 'beta'),
      // Plays in both campaigns
      createUser('Mike', 'mike'),
      // Plays in first campaign
      createUser('John', 'john'),
      createUser('Jenn', 'jenn'),
      createUser('Joe', 'joe'),
      // Plays in second campaign
      createUser('Nick', 'nick'),
      createUser('Nancy', 'nancy'),
      createUser('Nicole', 'nicole'),
      createUser('Nate', 'nate')
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
