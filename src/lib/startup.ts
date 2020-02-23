import { mongo } from '.'

class Startup {
  tasks: (() => Promise<void>)[]
  constructor () {
    this.tasks = []
  }

  addTask (callback: () => Promise<void>) {
    this.tasks.push(callback)
  }

  async start () {
    await mongo.start()
    await Promise.all(this.tasks.map(t => t()))
  }
}

export const startup = new Startup()
