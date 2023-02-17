---
title: angular 利用 module federation 实现微前端，并实现通信
date: 2023-02-17 13:48:25
tags:
---

## 创建项目，并实现模块共享

- 创建一个没有项目的空壳子

  ```typescript
    ng new shell --create-application=false
  ```

- 添加主应用和子应用 1

  ```typescript
    ng g application main
    ng g application mfe1
  ```

- 安装 `@angular-architects/module-federation`

  ```typescript
    npm i @angular-architects/module-federation -D
  ```

- 初始化主项目和子项目

  ```typescript
    ng g @angular-architects/module-federation:init --project main --port 4200 --type host
    ng g @angular-architects/module-federation:init --project mfe1 --port 4201 --type remote
  ```

- 在 mfe1 中创建一个 module，并创建一个组件

  ```typescript
  ng g m charts --project mfe1
  ng g c charts/map --project mfe1
  ```

- 在 charts.module.ts 中使用 map 组件

  ```typescript
  // mfe1 => charts.module.ts
  RouterModule.forChild([
    {
      path: "",
      component: MapComponent,
    },
  ]);
  ```

- 修改 mfe1 的 webpack.config.js 文件，把 charts 这个 module 暴露出去

  ```typescript
  // mfe1 => webpack.config.js
  module.exports = withModuleFederationPlugin({
    name: "mfe1",

    exposes: {
      "./Module": "./projects/mfe1/src/app/charts/charts.module.ts",
    },

    shared: {
      ...shareAll({
        singleton: true,
        strictVersion: true,
        requiredVersion: "auto",
      }),
    },
  });
  ```

- 在 main 中使用(消费)mfe1 暴露出来的 module

  ```typescript
  // main => webpack.config.js
  module.exports = withModuleFederationPlugin({
    remotes: {
      mfe1: "http://localhost:4201/remoteEntry.js",
    },

    shared: {
      ...shareAll({
        singleton: true,
        strictVersion: true,
        requiredVersion: "auto",
      }),
    },
  });
  ```

- 在代码中按照懒加载的形式使用这个 module，并且由于 mfe1/Module 没有定义，所欲需要在 app 文件夹下面创建一个 mfe.d.ts 的文件

  ```typescript
  // main => mfe.d.ts
  declare module "mfe1/Module";

  // main => app.module.ts
  RouterModule.forRoot([
    {
      path: "mfe1",
      loadChildren: () => import("mfe1/Module").then((m) => m.ChartsModule),
    },
  ]);
  ```

- 再另起一个项目 outProject(**重新另起一个大的项目，而不是在这个 shell 项目下面生成一个 mfe2 的 application**)，按照之前的步骤创建一个另外的子项目 mfe2，comments module，text component

  ```typescript
  // mfe2 => comments.module.ts
  RouterModule.forChild([
    {
      path: "",
      component: TextComponent,
    },
  ]);

  // mfe2 => webpack.config.js
  module.exports = withModuleFederationPlugin({
    name: "mfe2",

    exposes: {
      "./Module": "./projects/mfe2/src/app/comments/comments.module.ts",
    },

    shared: {
      ...shareAll({
        singleton: true,
        strictVersion: true,
        requiredVersion: "auto",
      }),
    },
  });

  // main => webpack.config.js
  module.exports = withModuleFederationPlugin({
    remotes: {
      mfe1: "http://localhost:4201/remoteEntry.js",
      mfe2: "http://localhost:4202/remoteEntry.js",
    },

    shared: {
      ...shareAll({
        singleton: true,
        strictVersion: true,
        requiredVersion: "auto",
      }),
      "projects/shared-lib/src/public-api": { singleton: true },
    },
  });

  // main => mfe.d.ts
  declare module "mfe1/Module";
  declare module "mfe2/Module";

  // main => app.module.ts
  RouterModule.forRoot([
    {
      path: "mfe1",
      loadChildren: () => import("mfe1/Module").then((m) => m.ChartsModule),
    },
    {
      path: "mfe2",
      loadChildren: () => import("mfe2/Module").then((m) => m.CommmentsModule),
    },
  ]);
  ```

## 实现不同项目中的通信

- 分别在两个项目中创建一个 library

  ```typescript
  ng g library shared-lib

  // shell => shared-lib => shared-lib.service.ts
  // outProject => shared-lib => shared-lib.service.ts
  @Injectable({
    providedIn: 'root'
  })
  export class SharedLibService {
    name = 'main SharedLibService'
    count = 0
    count$ = new Subject<number>()
    constructor() { }

    setCount(count: number) {
      this.count = count
      this.count$.next(count)
    }
  }
  ```

- 分别在两个项目中使用

  ```typescript
  // main => app.component.html
  <button type="button" [routerLink]="'/mfe2'">mfe2</button>
  <button type="button" [routerLink]="'/'">home</button>

  <p>main works name = {{name}}, count = {{count}}</p>
  <button (click)="onclick()">add</button>
  <router-outlet></router-outlet>
  <br />

  // main => app.component.ts
  title = 'main';
  name = ''
  count = 0
  constructor(
    private sharedLibService: SharedLibService
  ) {
    this.name = this.sharedLibService.name
    this.sharedLibService.count$.subscribe(count => {
      this.count = count
    })
  }
  onclick() {
    this.sharedLibService.setCount(this.count + 1)
  }

  // mfe2 => map.component.html
  <p>text works! name = {{name}}; count = {{count}}</p>

  // mfe2 => map.component.ts
  name = ''
  count = 0
  constructor(
    private sharedLibService: SharedLibService
  ) {
    this.name = this.sharedLibService.name
    this.sharedLibService.count$.subscribe(count => {
      this.count = count
    })
  }
  ```

  现在启动项目，点击 add 按钮，指挥更改 main 中的 count 值

- 最后一步，在两个项目的 webpack.config.js 中更改 shared

  ```typescript
  // main => webpack.config.js
  // mfe2 => webpack.config.js
  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: "auto",
    }),
    "projects/shared-lib/src/public-api": { singleton: true },
  },
  ```

  现在再点击 add，两个 count 值都会同步发生改变，这样就可以实现在不同的两个代码仓库中实现通信，**还有最重要的一点是，一定要在代码中都使用 shared-lib service，这样才不会再 build 中因为 tree shaking 导致这个 service 没有加载出来**
