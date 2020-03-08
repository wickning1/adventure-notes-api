/* global describe, it */
import { expect } from 'chai'
import { gql } from '../lib'

describe('unauthenticated tests', () => {
  it('should reject querying notes when unauthenticated', async () => {
    const promises = [
      gql.unauthenticated.request('{ adventures { id, name } }'),
      gql.unauthenticated.request('{ characters { id, name } }'),
      gql.unauthenticated.request('{ loginCharacters { id, name } }'),
      gql.unauthenticated.request('{ items { id, name } }'),
      gql.unauthenticated.request('{ locations { id, name } }'),
      gql.unauthenticated.request('{ users { id, name } }')
    ]
    await Promise.all(promises.map(p => expect(p).to.be.rejected))
  })
})
