import { MongoClient, Db } from 'mongodb'

class Mongo {
  public client!: MongoClient
  public db!: Db

  async start () {
    this.client = await MongoClient.connect(`mongodb://${process.env.DB_HOST || 'adventure-notes-db'}:${process.env.DB_PORT || 27017}`, {
      useUnifiedTopology: true
    })
    this.db = this.client.db(process.env.DB_DATABASE || 'adventurenotes')
  }
}

export const mongo = new Mongo()
