const PENDING = "pending";
const FULFILLED = "fulfilled";
const REJECTED = "rejected";

class _Promise {
  constructor(executor) {
    this.status = PENDING;
    this.value = undefined;
    this.reason = undefined;
    this.resolveCbs = [];
    this.rejectCbs = [];
    let resolve = (value) => {
      if (this.status === PENDING) {
        this.status = FULFILLED;
        this.value = value;
        this.resolveCbs.forEach((cb) => cb());
      }
    };
    let reject = (reason) => {
      if (this.status === PENDING) {
        this.status = REJECTED;
        this.reason = reason;
        this.rejectCbs.forEach((cb) => cb());
      }
    };
    executor(resolve, reject);
  }

  then(onResolve, onReject) {
    const newPromise = new _Promise((resolve, reject) => {
      if (this.status === FULFILLED) {
        const x = onResolve(this.value);
        resolve(x);
      }
      if (this.status === REJECTED) {
        const x = onReject(this.reason);
        reject(x);
      }

      if (this.status === PENDING) {
        this.resolveCbs.push(() => {
          const x = onResolve(this.value);
          resolve(x);
        });
        this.rejectCbs.push(() => {
          const x = onReject(this.value);
          reject(x);
        });
      }
    });

    return newPromise;
  }
}

const p1 = new Promise((resolve, reject) => {
  console.log("create promise");
  resolve("p1 resolve");
})
  .then(
    (data) => {
      console.log(data);
      return "1 resolve";
    },
    (err) => {
      console.log(err);
    }
  )
  .then(
    (data) => {
      console.log(data);
    },
    (err) => {
      console.log(err);
    }
  );
