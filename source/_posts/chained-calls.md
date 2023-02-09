---
title: js 链式调用
date: 2023-02-05 17:23:39
tags: [js, 链式调用]
---

# 原理

> 主要是在原型链上面添加函数，最后返回的是函数本身的 this 对象，操作的数据也是实例化对象的时候的数据

## class 实现

```typescript
class A {
  constructor(data) {
    this.data = data;
  }

  where(cb) {
    this.data = this.data.filter(cb);
    return this;
  }

  groupby(key) {
    const map = new Map();
    this.data.forEach((d) => {
      if (map.has(d[key])) {
        map.get(d[key]).push(d);
      } else {
        map.set(d[key], [d]);
      }
    });

    this.data = Array.from(map.values());
    return this;
  }

  excute() {
    console.log(this.data);
  }
}

function query(data) {
  return new A(data);
}

const data = [
  { id: 1, grade: 5, sex: 0 },
  { id: 2, grade: 9, sex: 0 },
  { id: 3, grade: 9, sex: 1 },
  { id: 4, grade: 12, sex: 0 },
];

query(data)
  .where((i) => i.sex === 0)
  .groupby("grade")
  .excute();
// [
//   [ { id: 1, grade: 5, sex: 0 } ],
//   [ { id: 2, grade: 9, sex: 0 } ],
//   [ { id: 4, grade: 12, sex: 0 } ]
// ]
```
