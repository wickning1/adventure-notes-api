import 'reflect-metadata'
import { install } from 'source-map-support'
import { ApolloServer } from 'apollo-server'
import { buildSchema } from 'type-graphql'
import { DataLoaderFactory } from 'dataloader-factory'
import { CharacterResolver, UserResolver, AdventureResolver } from './models'
import { Context, ObjectIdScalar } from './lib'
import { startServices } from './services'
import { ObjectId } from 'mongodb'

install()

async function main () {
  const schema = await buildSchema({
    resolvers: [AdventureResolver, CharacterResolver, UserResolver],
    scalarsMap: [{ type: ObjectId, scalar: ObjectIdScalar }],
    validate: false
  })

  const server = new ApolloServer({
    schema,
    context: ({ req }) => {
      return new Context(req.headers.authorization, new DataLoaderFactory())
    }
  })

  // Start the server
  await startServices()
  const { url } = await server.listen(80)
  console.log(`Server is running, GraphQL Playground available at ${url}`)
}

main().catch(err => console.error(err))
