import 'reflect-metadata'
import { install } from 'source-map-support'
import { ApolloServer } from 'apollo-server'
import { buildSchema } from 'type-graphql'
import { DataLoaderFactory } from 'dataloader-factory'
import { CharacterResolver, UserResolver, AdventureResolver } from './models'
import { Context } from './lib'

install()

async function main () {
  const schema = await buildSchema({
    resolvers: [AdventureResolver, CharacterResolver, UserResolver]
  })

  const server = new ApolloServer({
    schema,
    context: req => {
      return new Context('', new DataLoaderFactory())
    }
  })

  // Start the server
  const { url } = await server.listen(80)
  console.log(`Server is running, GraphQL Playground available at ${url}`)
}

main().catch(err => console.error(err))
