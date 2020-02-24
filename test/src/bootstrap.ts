/* global before */
import { mongo } from './lib'

before(async () => {
  await mongo.start()
  await mongo.reset()
})
