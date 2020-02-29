import { GraphQLClient } from 'graphql-request'

const API_URL = 'http://adventure-notes-api'
class GraphQLClients {
  clients: { [token: string]: GraphQLClient } = {}
  tokens: { [name: string]: string } = {}

  get unauthenticated () {
    if (!this.clients.raw) {
      this.clients.raw = new GraphQLClient(API_URL)
    }
    return this.clients.raw
  }

  storeToken (name: string, token: string) {
    this.tokens[name] = token
  }

  getClient (name: string) {
    if (!this.tokens[name]) throw new Error(`Token for ${name} has not been stored.`)
    if (!this.clients[name]) {
      this.clients[name] = new GraphQLClient(API_URL, {
        headers: {
          authorization: `Bearer ${this.tokens[name]}`
        }
      })
    }
    return this.clients[name]
  }
}

export const gql = new GraphQLClients()
