/* global before */
import { mongo } from './lib'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)

before(async () => {
  await mongo.start()
  await mongo.reset()
})
