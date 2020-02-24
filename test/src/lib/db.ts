import { MongoClient, Db } from 'mongodb'

class Mongo {
  public client!: MongoClient
  public db!: Db

  async start () {
    this.client = await MongoClient.connect('mongodb://adventure-notes-db:27017', {
      useUnifiedTopology: true
    })
    this.db = this.client.db('adventurenotes')
  }

  async reset () {
    const collections = await this.db.collections()
    await Promise.all(collections.map(async c => {
      if (!c.collectionName.startsWith('system.')) await c.deleteMany({})
    }))
  }
}

export const mongo = new Mongo()
