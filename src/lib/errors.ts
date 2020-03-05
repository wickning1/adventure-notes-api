import { ApolloError, AuthenticationError, ForbiddenError, UserInputError } from 'apollo-server'

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

export class NotAuthorizedError extends ForbiddenError {
  constructor (message?: string) {
    super(message || 'You are not allowed to do that.')
  }
}

export interface FieldError {
  field: string
  message?: string
}

export class ValidationError extends UserInputError {
  constructor (fielderrors: FieldError[], message?: string) {
    super(message || 'Mutation had validation errors.', {
      invalidArgs: fielderrors
    })
  }
}
