---
title: angular 利用 module federation 实现微前端，并实现通信(2)
date: 2023-03-04 18:10:03
tags:
---

书接上文，现在已经实现了在一个项目中使用另一个项目的 module，但是还有一些 bug 在现有项目的改造中会碰到，或者还有一些优化

## 把整个项目都 expose 出去

很多项目中 shell 项目都只是一个架子，一般都是直接使用 mfe2 的全部功能，就需要 mfe2 把自己 AppModule 直接 expose 出来，但是这是不可行的

因为，在 shell 中是使用 RouterModule.forRoot 的，mfe2 的 AppModule 也是使用 RouterModule.forRoot，两者是不能兼容的，所以不能直接 expose AppModule 的

所以，就需要在 mfe2 项目的 AppModule 外面再包一层，我们姑且叫它 DashboardModule

1. 创建 DashboardModule 和 dashboard component

   ```typescript
   ng g m dashboard --flat true --project mfe2
   ng g c dashboard --project mfe2 --module dashboard
   ```

2. DashboardModule 中使用 BrowserModule 和 RouterModule.forRoot，在 AppModule 中使用 CommonModule 和 BouterModule.forChild

3. 把 angular 默认的入口改成 DashboardModule

4. webpack.config.js 中更改 expose 属性

   ```typescript
   // dashboard.module.ts
   @NgModule({
     declarations: [DashboardComponent],
     imports: [
       BrowserModule,
       RouterModule.forRoot([
         {
           path: "",
           loadChildren: () => import("./app.module").then((m) => m.AppModule),
         },
       ]),
     ],
     bootstrap: [DashboardComponent],
   })
   export class DashboardModule {}

   // dashboard.component.html
   <p>mfe2 dashboard works!</p>
   <button [routerLink]="'/'">home</button>
   <button [routerLink]="'/comments'">comments</button>
   <router-outlet></router-outlet>

   // app.module.ts
   @NgModule({
    declarations: [
      AppComponent
    ],
    imports: [
      CommonModule,
      RouterModule.forChild([
        {
          path: '',
          component: AppComponent,
          children: [
            {
              path: 'comments',
              loadChildren: () => import('./comments/comments.module').then(m => m.CommentsModule)
            },
          ]
        }
      ])
    ],
    providers: []
   })
   export class AppModule { }

   // bootstrap.ts
   platformBrowserDynamic().bootstrapModule(DashboardModule)
     .catch(err => console.error(err));

   // index.html
   <body>
     <app-dashboard></app-dashboard>
   </body>

   // webpack.config.js
    exposes: {
    "./CommentsModule": "./projects/mfe2/src/app/comments/comments.module.ts",
    "./AppModule": "./projects/mfe2/src/app/app.module.ts",
   },
   ```

## 在 shell 中使用 AppModule

```typescript
// 方法1:
// webpack.config.js
remotes: {
 mfe2: "http://localhost:4202/remoteEntry.js",
},
// mfe.d.ts
declare module 'mfe2/AppModule'
// app.module.ts
RouterModule.forRoot([
  {
    path: "mfe2",
    loadChildren: () => import("mfe2/AppModule").then((m) => m.AppModule),
  },
]);
// 方法2:
RouterModule.forRoot([
  {
    path: "mfe2",
    loadChildren: () =>
      loadRemoteModule({
        type: "module",
        remoteEntry: "http://localhost:4202/remoteEntry.js",
        exposedModule: "./AppModule",
      }).then((m) => m.AppModule),
  },
]);
```

## 拦截器问题

拦截器一般都是放在根 module 中的，在 mfe2 项目改造前是在 AppModule 中的，改造后，因为还是要放在 AppModule 中的，并且拦截器依赖于 HttpClientModule，所以，HttpClientModule 要和拦截器在一个 module 下面，也就是需要在 AppModule 中

## Service 问题

在上面 拦截器问题 中提到过 HttpClientModule，在 Service 中必然不可缺少的就是 http 请求，也需要依赖 HttpClientModule，所以，所有的 Service 就不能直接 providedIn: 'root'，而是需要在 AppModule 中的 providers 中注入 Service

## 项目间通信（npm）

如果在每个项目中都写一遍 shared-lib 是很麻烦的，我们可以把 shared-lib 的代码发布到 npm 上面，在需要的项目中直接引用，shared-lib 中写一些公共的代码来实现项目间的通信
