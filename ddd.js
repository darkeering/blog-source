const fn = console.log

console.log = function (obj) {
  fn(obj.data)
}

class A {
  constructor(data) {
    this.data = data
  }
  add(val) {
    this.data += val
    return this
  }
  minus(val) {
    this.data -= val
    return this
  }
  multi(val) {
    this.data *= val
    return this
  }
  div(val) {
    this.data /= val
    return this
  }
}

function myCalculator (data) {
  // your code
  return new A(data)
}

console.log(myCalculator(121).add(1).minus(2).multi(3).div(4))