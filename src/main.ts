import 'reflect-metadata'
import { install } from 'source-map-support'
import { ApolloServer } from 'apollo-server'
import { Container } from 'typedi'
import { buildSchema } from 'type-graphql'
import { CharacterResolver } from './models'

install()

async function main () {
  const schema = await buildSchema({
    resolvers: [CharacterResolver],
    container: Container
  })

  const server = new ApolloServer({ schema })

  // Start the server
  const { url } = await server.listen(80)
  console.log(`Server is running, GraphQL Playground available at ${url}`)
}

main().catch(err => console.error(err))
