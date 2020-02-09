import { MongoClient, Db } from 'mongodb'

export let client: MongoClient
export let db: Db
export async function connectMongo () {
  client = await MongoClient.connect(`mongodb://${process.env.DB_HOST || 'adventure-notes-db'}:${process.env.DB_PORT || 27017}`, {
    useUnifiedTopology: true
  })
  db = client.db(process.env.DB_DATABASE || 'adventurenotes')
}
