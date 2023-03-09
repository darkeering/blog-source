---
title: angular 利用 module federation 实现微前端，并实现通信(3)
date: 2023-03-10 00:15:00
tags:
---

书接上文，我们已经实现了，项目间通信，拦截器，接下来我们要解决的问题是：1. 样式问题 2. 路由问题

## 样式问题

在 angular 中，一般的组件中的样式并不会被影响，但是全局样式是会被影响的

我们一般会在 angular.json 文件中引入公共样式和依赖的组件库的样式

但是在 expose 出去的 AppModule 中，并不会把这些公共样式带着

所以我们需要在 AppModule 中导入这些公共的样式文件

我们可以把这些公共样式单独的建一个 css 文件（最好是 css 文件，在一般组件库肯定会打包成 css 文件，而且 css 文件会被浏览器直接识别，没有预编译的问题），我们姑且叫他 main.css

```typescript
// main.css
@import "../../../node_modules/ng-devui/devui.min.css";
@import '../../../node_modules/@devui-design/icons/icomoon/devui-icon.css';

@import "../../../node_modules/ng-zorro-antd/ng-zorro-antd.min.css";
@import "./styles.css";
```

虽然，AppModule 是懒加载，但是在整个项目进来的时候，相当于直接加载，并且 router-outlet 是在 app component 上面的（你也可以设置你需要的组件），所以我们直接在 app component 中使用 main.css

**这里是重要的一点，虽然在 app component 中引入了公共样式，但是现在这个样式文件只能作用于 app component 这一个组件，所以这还不算是公共样式，我们需要去掉 angular 在编译时对该组件的样式编译**

```typescript
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['../main.css','./app.component.css'],
  encapsulation: ViewEncapsulation.None
})
```

最后一点，关于图标字体库的问题，暂时还没有解决方案，敬请期待

## 路由问题

因为子项目是通过 module 的方式接入的主项目，并且技术栈都是 angular，所以我们在子项目进行路由切换的时候，其实走的还是主项目的路由，但是在子项目中我们并不会在前面加一层前缀，所以会报一些找不到路由的情况

主要原因还是因为在子项目中进行路由跳转的时候，子项目并不知道这时是子项目，但是在子项目中加路由前缀，又太麻烦，所以，我在主项目路由跳转时做了一个简单的路由守卫（canActive）

```typescript
// shell 项目
// can-active.guard.ts
@Injectable({
  providedIn: "root",
})
export class CanActiveGuard implements CanActivate {
  constructor(private router: Router) {}
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    const currentMfe = this.router.url.split("/")[1];
    // 当子路由进行切换的时候，判断当前是哪个子项目，自动在前面加上当前子项目对应的路由前缀
    if (currentMfe !== "" || (currentMfe === "" && state.url !== "/")) {
      const hasFind = this.router.config.find((r) => r.path === currentMfe);
      if (hasFind) {
        const url = `${"/" + currentMfe}${state.url}`;
        this.router.navigate([url]);
        return false;
      }
    }
    return true;
  }
}

// app.module.ts
RouterModule.forRoot([
  {
    path: "",
    canActivate: [CanActiveGuard],
    component: HomeComponent,
    pathMatch: "full",
  },
  {
    path: "mfe1",
    loadChildren: () => import("mfe1/Module").then((m) => m.ChartsModule),
  },
  {
    path: "mfe2",
    // canDeactivate: [LeaveGuard],
    loadChildren: () =>
      loadRemoteModule({
        type: "module",
        remoteEntry: "http://localhost:4202/remoteEntry.js",
        exposedModule: "./AppModule",
      }).then((m) => m.AppModule),
  },
  {
    path: "**",
    canActivate: [CanActiveGuard],
    component: NotfoundComponent,
  },
]);
```

但是，这个还是有 bug 的，在当你一个 a 项目切换到另一个 b 项目的时候，通过浏览器的后退按钮是不好用的，因为，判断的当前的路由是 b 项目的，所以还是会走路由守卫

另一个就是，当你从一个项目切换到另一个项目的时候，最好还是走项目间的通信，把相关信息传递给 shell 项目，通过 shell 项目进行路由切换
