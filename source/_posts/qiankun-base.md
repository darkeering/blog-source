---
title: 微前端 qiankun 基座应用
date: 2023-02-05 19:04:10
tags: [微前端, react]
---

# 生成项目

```typescript
npx create-react-app <app-name> --template=typescript
```

# qiankun 配置

1. 添加 qiankun

   ```typescript
   yarn add qiankun
   ```

2. src 下添加 `public-path.js`

   ```typescript
   if (window.__POWERED_BY_QIANKUN__) {
     // eslint-disable-next-line no-undef
     __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__;
   }
   ```

3. 修改 `index.jsx`

   ```typescript
   import "zone.js/dist/zone"; // 如果子应用有angular，把子应用的zone.js引入删除，在base应用import
   import React from "react";
   import ReactDOM from "react-dom/client";
   import "./index.css";
   import App from "./App";
   import reportWebVitals from "./reportWebVitals";
   import { registerMicroApps, start } from "qiankun";
   import { BrowserRouter } from "react-router-dom";
   // qiankun 配置
   registerMicroApps([
     {
       name: "rc-child", // 每一个子应用的名字  React应用的名字不重要
       entry: "//localhost:3001", // 子应用的端口 必须一致
       container: "#rc-child", // 子应用在父应用的挂载点
       activeRule: (location) => location.pathname.startsWith("/rc-child"), // 父应用中激活子应用的规则
     },
     {
       name: "ng-child", // 每一个子应用的名字  React应用的名字不重要
       entry: "//localhost:3002", // 子应用的端口 必须一致
       container: "#ng-child", // 子应用在父应用的挂载点
       activeRule: (location) => location.pathname.startsWith("/ng-child"), // 父应用中激活子应用的规则
     },
   ]);
   // 启动 父应用
   start();

   const root = ReactDOM.createRoot(
     document.getElementById("root") as HTMLElement
   );
   root.render(
     <BrowserRouter>
       <App></App>
     </BrowserRouter>
   );

   // If you want to start measuring performance in your app, pass a function
   // to log results (for example: reportWebVitals(console.log))
   // or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
   reportWebVitals();
   ```

# 组件库 react-darui

# 参考链接

> [antd 组件库](https://ant.design/components/overview-cn/)

> [qiankun 实践](https://juejin.cn/post/6986258669172490271)
