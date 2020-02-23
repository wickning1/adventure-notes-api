/* eslint-disable import/first */
import { install } from 'source-map-support'
install()
import 'reflect-metadata'
import { ApolloServer } from 'apollo-server'
import { buildSchema } from 'type-graphql'
import { Context, ObjectIdScalar, startup } from './lib'
import { CharacterResolver, UserResolver, AdventureResolver } from './models'
import { ObjectId } from 'mongodb'

async function main () {
  const schema = await buildSchema({
    resolvers: [AdventureResolver, CharacterResolver, UserResolver],
    scalarsMap: [{ type: ObjectId, scalar: ObjectIdScalar }],
    validate: false
  })

  const server = new ApolloServer({
    schema,
    context: ({ req }) => {
      return new Context(req.headers.authorization)
    }
  })

  // Start the server
  await startup.start()
  const { url } = await server.listen(80)
  console.log(`Server is running, GraphQL Playground available at ${url}`)
}

main().catch(err => console.error(err))
