import { MongoClient, Db } from 'mongodb'

class Mongo {
  public client!: MongoClient
  public db!: Db

  async start () {
    if (process.env.DB_PASS === 'overridethis') throw new Error('Using the default password for production is not allowed. Create a docker-compose.prod.override.yml file and provide a secure password.')
    const userpass = process.env.DB_USER ? `${process.env.DB_USER}:${process.env.DB_PASS}@` : ''
    this.client = await MongoClient.connect(`mongodb://${userpass}${process.env.DB_HOST || 'adventure-notes-db'}:${process.env.DB_PORT || 27017}`, {
      useUnifiedTopology: true
    })
    this.db = this.client.db(process.env.DB_DATABASE || 'adventurenotes')
  }
}

export const mongo = new Mongo()
