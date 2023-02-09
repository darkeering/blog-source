---
title: 微前端 qiankun react子应用
date: 2023-02-05 19:06:12
tags: [微前端, react]
---

# 生成项目

```typescript
npx create-react-app <app-name> --template=typescript
```

# qiankun 配置

1. 添加打包工具
   ```typescript
   yarn add @rescripts/cli
   ```
2. 配置打包信息，在根目录下添加 `.rescriptsrc.js`

   ```typescript
   const { name } = require("./package");
   module.exports = {
     webpack: (config) => {
       config.output.library = `${name}-[name]`;
       config.output.libraryTarget = "umd";
       // config.output.jsonpFunction = `webpackJsonp_${name}`;
       config.output.globalObject = "window";

       return config;
     },

     devServer: (_) => {
       const config = _;
       config.port = "3002";
       config.headers = {
         "Access-Control-Allow-Origin": "*",
       };
       config.historyApiFallback = true;
       config.hot = false;
       // config.watchContentBase = false;
       config.liveReload = false;

       return config;
     },
   };
   ```

3. src 下添加 `public-path.js`
   ```typescript
   if (window.__POWERED_BY_QIANKUN__) {
     // eslint-disable-next-line no-undef
     __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__;
   }
   ```
4. 修改 `index.jsx`

   ```typescript
   import "./public-path";
   import React from "react";
   import ReactDOM from "react-dom";
   import App from "./App";
   import { BrowserRouter } from "react-router-dom";

   function render(props) {
     const { container } = props;
     ReactDOM.render(
       <BrowserRouter
         basename={window.__POWERED_BY_QIANKUN__ ? "/rc-child" : "/"}
       >
         <App />
       </BrowserRouter>,
       container
         ? container.querySelector("#root")
         : document.querySelector("#root")
     );
   }

   if (!window.__POWERED_BY_QIANKUN__) {
     render({});
   }

   export async function bootstrap() {
     console.log("[react16] react app bootstraped");
   }

   export async function mount(props) {
     console.log("[react16] props from main framework", props);
     render(props);
   }

   export async function unmount(props) {
     const { container } = props;
     ReactDOM.unmountComponentAtNode(
       container
         ? container.querySelector("#root")
         : document.querySelector("#root")
     );
   }
   ```

# 组件库 react-darui

# 参考链接

> [antd 组件库](https://ant.design/components/overview-cn/)
