export class Counter {
  constructor(total = 1) {
    this.total = total
    this.index = 0
  }

  next() {
    this.index++

    if (!(this.index % this.total)) {
      this.index = 0
    }

    return this.index
  }
}
