---
title: 手写简易promise
date: 2023-02-07 16:00:00
tags:
---

## Promise 的能力

解决了回调地狱

- 嵌套调用，第一个函数的返回值是第二个函数的入参（**then 的链式调用**）
- 处理多个并发异步请求（**Promise.all**）

## 手写 Promise

Promise 的核心

1. 有三个状态 pending、resolved、rejected，一旦改变，不可逆转
2. Promise 构造函数接受一个 excutor 函数，立即执行
3. excutor 有两个函数，resolve，reject
4. then 函数接收两个函数，onResolve，onReject，excutor 调用 resolve。then 实现 onResolve，excutor 调用 reject，then 实现 onReject
5. then 的链式调用和值的穿透

### \_Promise 1.0

```typescript
const p1 = new _Promise((resolve, reject) => {
  resolve("success");
  reject("failed");
}).then(
  (data) => {
    console.log(data);
  },
  (err) => {
    console.log(err);
  }
);
```

首先我们希望这个最简单的代码能跑起来，根据上述的核心，先搭一个大概的架子

```typescript
class _Promise {
  constructor(executor) {
    this.status = "pending";
    this.value = undefined;
    this.reason = undefined;
    let resolve = () => {};
    let reject = () => {};
    executor(resolve, reject);
  }

  then(onResolve, onReject) {}
}
```

调用 resolve 和 reject 的时候，状态要改变，并且把值保存起来

```typescript
class _Promise {
  constructor(executor) {
    this.status = "pending";
    this.value = undefined;
    this.reason = undefined;
    let resolve = (value) => {
      if (this.status === "pending") {
        this.value = value;
        this.status = "resolved";
      }
    };
    let reject = (reason) => {
      if (this.status === "pending") {
        this.reason = reason;
        this.status = "rejected";
      }
    };
    executor(resolve, reject);
  }

  then(onResolve, onReject) {}
}
```

then 函数会接受两个方法 resolve 就执行第一个，reject 就执行第二个

```typescript
class _Promise {
  constructor(executor) {
    // ...
  }

  then(onResolve, onReject) {
    if (this.status === "resolved") {
      onResolve(this.value);
    }
    if (this.status === "rejected") {
      onReject(this.reason);
    }
  }
}
```

执行一下代码，确实是我们需要的，而且 resolve 执行过后，再调用 reject 也不起作用了

![img](/assets/promise/1.png)

### \_Promise 2.0

接下来，我们在 excutor 中传入一个异步操作

![img](/assets/promise/2.png)

发现，如上图所示，并没有任何的输出，这是因为代码运行到 then 方法的时候，resolve 没有调用，所以 status 还是 pending 状态的，所以没有输出。因此我们需要把回调函数存起来，当 resolve 或 reject 调用的时候，再执行

```typescript
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

  then(onResolve, onReject) {
    if (this.status === "resolved") {
      onResolve(this.value);
    }
    if (this.status === "rejected") {
      onReject(this.reason);
    }

    if (this.status === "pending") {
      this.onResolveCbs.push(() => {
        onResolve(this.value);
      });
      this.onRejectCbs.push(() => {
        onReject(this.reason);
      });
    }
  }
}
```

执行一下，我们可以看到异步成功的执行了

![img](/assets/promise/3.png)

### \_Promise 3.0

前面的都是基础，接下来的 then 的链式和值的穿透才是重点

![img](/assets/promise/4.png) ![img](/assets/promise/5.png)

> then 返回的是一个新的 Promise 对象
> return 的值新 Promise 的 resolve 的参数

```typescript
then(onResolve, onReject) {
  // if (this.status === "resolved") {
  //   onResolve(this.value);
  // }
  // if (this.status === "rejected") {
  //   onReject(this.reason);
  // }

  // if (this.status === "pending") {
  //   this.onResolveCbs.push(() => {
  //     onResolve(this.value);
  //   });
  //   this.onRejectCbs.push(() => {
  //     onReject(this.reason);
  //   });
  // }
  const newpromise = new _Promise((resolve, reject) => {})

  return newpromise
}
```

原来的逻辑还是要存在的，但是新的 promise 的 resolve 函数的参数，需要获得现在这一个 then 函数的返回值

```typescript
then(onResolve, onReject) {
  let x;
  const newpromise = new _Promise((resolve, reject) => {
    if (this.status === "resolved") {
      x = onResolve(this.value);
      resolve(x);
    }
    if (this.status === "rejected") {
      x = onReject(this.reason);
      resolve(x);
    }

    if (this.status === "pending") {
      this.onResolveCbs.push(() => {
        x = onResolve(this.value);
        resolve(x);
      });
      this.onRejectCbs.push(() => {
        x = onReject(this.reason);
        resolve(x);
      });
    }
  });

  return newpromise;
}
```

执行之后的结果是正确的
![img](/assets/promise/6.png)

但是，去掉 excutor 中的 settimeout 函数之后，结果和正统的 Promise 结果(1->2->success->11->22)不一样

![img](/assets/promise/7.png)

这是因为正统的 Promise 中的 then 是异步的

所以我们的 onResolve，onReject 也要是异步的，这就需要我们在外层加上异步函数

```typescript
  then(onResolve, onReject) {
    let x;
    const newpromise = new _Promise((resolve, reject) => {
      if (this.status === "resolved") {
        setTimeout(() => {
          x = onResolve(this.value);
          resolve(x);
        });
      }
      if (this.status === "rejected") {
        setTimeout(() => {
          x = onReject(this.reason);
          resolve(x);
        });
      }

      if (this.status === "pending") {
        this.onResolveCbs.push(() => {
          setTimeout(() => {
            x = onResolve(this.value);
            resolve(x);
          });
        });
        this.onRejectCbs.push(() => {
          setTimeout(() => {
            x = onReject(this.reason);
            resolve(x);
          });
        });
      }
    });

    return newpromise;
  }
```

这是链式调用，接下来还有值的穿透，要是用现在的代码去跑代码.then().then()一定会报错，因为你的 then 方法根本什么参数都没有传，所以需要在 then 函数刚开始的时候进行判断，如果不是一个函数，那就直接设置 onResolve 为`(v) => v`方法，这样后面调用的时候直接返回的就是 value 值，onReject 也是一样的

```typescript
then(onResolve, onReject) {
  if (typeof onResolve !== "function") onResolve = (v) => v;
  if (typeof onReject !== "function") onReject = (v) => v;
  let x;
  const newpromise = new _Promise((resolve, reject) => {
    if (this.status === "resolved") {
      setTimeout(() => {
        x = onResolve(this.value);
        resolve(x);
      });
    }
    if (this.status === "rejected") {
      setTimeout(() => {
        x = onReject(this.reason);
        resolve(x);
      });
    }

    if (this.status === "pending") {
      this.onResolveCbs.push(() => {
        setTimeout(() => {
          x = onResolve(this.value);
          resolve(x);
        });
      });
      this.onRejectCbs.push(() => {
        setTimeout(() => {
          x = onReject(this.reason);
          resolve(x);
        });
      });
    }
  });

  return newpromise;
}
```

执行看一下结果，确实实现了值的穿透
![img](/assets/promise/8.png)

至此，我们就大致实现了一个建议的 Promise，之后的就是处理一些特殊情况、实现一些 promise 的 api 和进行公共方法的封装

### \_Promise 4.0

then 函数的返回值有这几类

1. 如果不是对象也不是函数，那就直接 resolve
2. 如果是一个对象或者一个函数，但是不含有 then 函数，说明不是 promise 对象，直接 resolve
3. 如果是一个对象或者一个函数，但是含有 then 函数，说明是一个 promise 对象，需要实现这个 promise 然后 then 的返回值来

所以我们需要封装一个 resolvePromise 函数

```typescript
resolvePromise(x, resolve, reject) {
  resolve(x)
}

then(onResolve, onReject) {
  if (typeof onResolve !== "function") onResolve = (v) => v;
  if (typeof onReject !== "function") onReject = (v) => v;
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
```

resolvePromise 函数需要满足之前说的三个条件

```typescript
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
```

最后添加一个 promise.all 方法

```typescript
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
```
