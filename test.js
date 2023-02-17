class _Promise {
  constructor(executor) {
    this.status = "pending"; // 状态
    this.value = undefined; // resolve的值
    this.reason = undefined; // reject的值
    this.onResolveCbs = []; // onResolve 回调
    this.onRejectCbs = []; // onReject 回调
    let resolve = (value) => {
      // 状态改变之后不可逆
      if (this.status === "pending") {
        this.value = value;
        this.status = "resolved";
        this.onResolveCbs.forEach((cb) => cb());
      }
    };
    let reject = (reason) => {
      // 状态改变之后不可逆
      if (this.status === "pending") {
        this.reason = reason;
        this.status = "rejected";
        this.onRejectCbs.forEach((cb) => cb());
      }
    };
    executor(resolve, reject);
  }

  resolvePromise(x, resolve, reject) {
    const xType = typeof x;
    if (xType !== "object" && xType !== "function") {
      resolve(x);
      return;
    }
    const then = x.then;

    if (typeof then === "function") {
      then.call(
        x,
        (data) => {
          this.resolvePromise(data, resolve, reject);
        },
        (reason) => {
          reject(reason);
        }
      );
    } else {
      resolve(x);
    }
  }

  then(onResolve, onReject) {
    if (typeof onResolve !== "function") onResolve = (v) => v;
    if (typeof onReject !== "function")
      onReject = (r) => {
        throw r;
      };
    let x;
    const newpromise = new _Promise((resolve, reject) => {
      if (this.status === "resolved") {
        setTimeout(() => {
          x = onResolve(this.value);
          this.resolvePromise(x, resolve, reject);
        });
      }
      if (this.status === "rejected") {
        setTimeout(() => {
          x = onReject(this.reason);
          this.resolvePromise(x, resolve, reject);
        });
      }

      if (this.status === "pending") {
        this.onResolveCbs.push(() => {
          setTimeout(() => {
            x = onResolve(this.value);
            this.resolvePromise(x, resolve, reject);
          });
        });
        this.onRejectCbs.push(() => {
          setTimeout(() => {
            x = onReject(this.reason);
            this.resolvePromise(x, resolve, reject);
          });
        });
      }
    });

    return newpromise;
  }

  static all(promises) {
    return new _Promise((resolve, reject) => {
      let count = 0;
      let arr = [];
      promises.forEach((promise, index) => {
        promise.then(
          (res) => {
            count++;
            arr[index] = res;
            if (count >= promises.length) resolve(arr);
          },
          (err) => {
            reject(err);
          }
        );
      });
    });
  }
}

// _Promise
//   .resolve(
//     new _Promise((resolve) => {
//       resolve("11");
//     })
//   )
//   .then((res) => {
//     console.log(res);
//   });

_Promise
  .all([
    new _Promise((resolve, reject) => {
      resolve(1);
    }),
    new _Promise((resolve, reject) => {
      reject(2);
    }),
    new _Promise((resolve, reject) => {
      resolve(3);
    }),
  ])
  .then(
    (res) => {
      console.log(res);
    },
    (err) => {
      console.log("reject", err);
    }
  );
