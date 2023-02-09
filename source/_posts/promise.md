---
title: 手写简易promise
date: 2023-02-07 16:00:00
tags:
---

## 原 promise 最简单的怎么用？

```typescript
const p1 = new _Promise((resolve, reject) => {
  console.log("create promise");
  resolve("p1 resolve");
})
  .then(
    (data) => {
      console.log(data);
      return "p2 resolve";
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
// create promise
// p1 resolve
// p2 resolve
```

## 自己的 promise

- 创建 class 类

  > 这是一个最简单的 promise，不包括链式调用，不包括异步

  ```typescript
  const PENDING = "pending";
  const FULFILLED = "fulfilled";
  const REJECTED = "rejected";

  class _Promise {
    constructor(executor) {
      this.status = PENDING;
      this.value = undefined;
      this.reason = undefined;
      let resolve = (value) => {
        this.status = FULFILLED;
        this.value = value;
      };
      let reject = (reason) => {
        this.status = REJECTED;
        this.reason = reason;
      };
      executor(resolve, reject);
    }

    then(onSuccess, onError) {
      if (this.status === FULFILLED) {
        onSuccess(this.value);
      }
      if (this.status === REJECTED) {
        onError(this.reason);
      }
    }
  }
  ```

- 处理异步

  > 如果 executor 函数里面有异步函数

  ```typescript
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
          this.resolveCbs.forEach((cb) => cb(this.value));
        }
      };
      let reject = (reason) => {
        if (this.status === PENDING) {
          this.status = REJECTED;
          this.reason = reason;
          this.rejectCbs.forEach((cb) => cb(this.value));
        }
      };
      executor(resolve, reject);
    }

    then(onResolve, onReject) {
      if (this.status === FULFILLED) {
        onResolve(this.value);
      }
      if (this.status === REJECTED) {
        onReject(this.reason);
      }

      if (this.status === PENDING) {
        this.resolveCbs.push(onResolve);
        this.rejectCbs.push(onReject);
      }
    }
  }
  ```

- 处理链式调用
