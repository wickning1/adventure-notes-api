import { ApolloError } from 'apollo-server'

export class ConcurrencyError extends ApolloError {
  constructor (message?: string) {
    super(message || 'Update failed because document version number was too old. User should be notified.', 'CONCURRENCY_ERROR')
  }
}

export class AdventureNotChosenError extends ApolloError {
  constructor (message?: string) {
    super(message || 'You must choose an adventure before doing that.', 'ADVENTURE_ERROR')
  }
}
