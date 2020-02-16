import { ApolloError, AuthenticationError } from 'apollo-server'

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

export class NotFoundError extends ApolloError {
  constructor (message?: string) {
    super(message || 'Resource not found.', 'NOT_FOUND_ERROR')
  }
}

export class UnauthenticatedError extends AuthenticationError {
  constructor (message?: string) {
    super(message || 'You must log in first.')
  }
}
