import 'reflect-metadata'
import { install } from 'source-map-support'
import { ApolloServer } from 'apollo-server'
import { buildSchema } from 'type-graphql'
import { DataLoaderFactory } from 'dataloader-factory'
import { CharacterResolver, UserResolver, AdventureResolver } from './models'
import { Context, mongo, ObjectIdScalar } from './lib'
import { BaseService } from './services'
import { ObjectId } from 'mongodb'

install()

async function main () {
  const schema = await buildSchema({
    resolvers: [AdventureResolver, CharacterResolver, UserResolver],
    scalarsMap: [{ type: ObjectId, scalar: ObjectIdScalar }]
  })

  const server = new ApolloServer({
    schema,
    context: ({ req }) => {
      return new Context(req.headers.authorization, new DataLoaderFactory())
    }
  })

  // Start the server
  await mongo.start()
  await BaseService.start()
  const { url } = await server.listen(80)
  console.log(`Server is running, GraphQL Playground available at ${url}`)
}

main().catch(err => console.error(err))
