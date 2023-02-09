---
title: react 简化版类似angular service的状态管理
date: 2023-02-06 12:59:48
tags: [状态管理, react, 自定义]
---

## 原理

> react 的 context.Provider 组件会在子组件创建一个一个上下文，函数子组件总可以通过 useContext 方法来获取 context 传递的数据

## 实现

- 首先，我们需要先创建一个 context

  ```typescript
  const SERVICE_CONTEXT = createContext(null);
  ```

- 然后在我们需要的组件外层包上 context.Provider 组件，我们可以通过一个方法来实现

  ```typescript
  function createServiceProvider<C>(Comp: React.FC<C>) {
    return React.memo((props: any) => {
      return (
        <SERVICE_CONTEXT.Provider>
          <Comp {...props}></Comp>
        </SERVICE_CONTEXT.Provider>
      );
    });
  }
  ```

- service 的创建就像 angular 一样，直接创建一个 service 的 class，这中间的 Subject 使用的是 rxjs，直接 `npm i rxjs` 就行

  ```typescript
  class UserService {
    name = "admin";
    age: number = 18;
    age$ = new Subject<number>();

    setAge(age: number) {
      this.age = age;
      this.age$.next(this.age);
    }
  }
  ```

- 之后，我们需要把我们 service 通过 createServiceProvider 函数注册到他的上下文中

  > 首先我们考虑的全局唯一的情况，就可以在 App 组件上面用，此时没有外层 service，所以代码运行到这里只需要直接进行实例化，然后在全局的上下文中都可以使用到注册的 service

  ```typescript
  function createServiceProvider<C>(Comp: React.FC<C>, services: any) {
    return React.memo((props: any) => {
      // const outerContext = useContext(SERVICE_CONTEXT);
      let providers: any = {};
      // if (outerContext) providers = Object.create(outerContext);

      for (let service of services) {
        providers[service.name] = new service();
      }

      return (
        <SERVICE_CONTEXT.Provider value={providers}>
          <Comp {...props}></Comp>
        </SERVICE_CONTEXT.Provider>
      );
    });
  }
  ```

- 那么在组件中怎么用呢？

  - 可以直接用 hook 钩子来获取

    ```typescript
    // 获取全部的service，然后需要哪个获取哪个
    const providers: any = useContext(SERVICE_CONTEXT);
    const provider = providers[<service.name>];
    ```

  - 自定义 hook 函数
    ```typescript
    function useServiceHook<T>(service: new () => T): T {
      const providers: any = useContext(SERVICE_CONTEXT);
      const provider = providers[(service as any).name];
      if (provider) {
        return provider;
      } else {
        throw new Error(
          `未找到${
            (service as any).name
          }的依赖值，请在上层servcieComponent中提供对应的service`
        );
      }
    }
    ```

- 接下来我们在组件中使用

  ```typescript
  export default createServiceProvider(User, [UserService]);

  function User() {
    const userService = useServiceHook(UserService);
    const [name, setname] = useState(userService.name);
    const [age, setage] = useState(userService.age);
    useEffect(() => {
      const subscriptions: Subscription[] = [];
      subscriptions.push(
        userService.age$.subscribe((age) => {
          setage(age);
        })
      );
      return () => {
        subscriptions.forEach((i) => i.unsubscribe());
      };
    }, []);

    const addAge = () => {
      userService.setAge(age + 1);
    };
    return (
      <div>
        <span>
          I am user: {name}, my age is {age}
        </span>{" "}
        <button onClick={addAge}>add age</button>
      </div>
    );
  }
  ```

- 在子组件中使用，创建一个另一个组件和另一个 service，然后把之前 createServiceProvider 函数中注释的内容放开，分别试试 User 组件中注册和不注册 UserService (createServiceProvider(User, [UserService]) 和 createServiceProvider(User))

  > User 不注册 UserService，改了其中一个 user 组件中的 age，另一个 user 组件 age 会同步变化
  > User 注册 UserService，改了其中一个 user 组件中的 age，另一个 user 组件 age 不会同步变化
  > 这是因为父组件 Home 也注册了 UserService，User 子组件如果不注册自己的 service，就会共享父组件的 service 数据，但是如果 User 子组件注册了自己的 service，对于同一个 service 就具有不同的上下文

  ```typescript
  class ManageService {
    manageId: number = 1;
    manageId$ = new Subject<number>();

    setManageId(id: number) {
      this.manageId = id;
      this.manageId$.next(this.manageId);
    }
  }

  export default createServiceProvider(Home, [ManageService, UserService]);

  function Home() {
    const manageService = useServiceHook(ManageService);
    const [manageId, setmanageId] = useState(manageService.manageId);

    useEffect(() => {
      const subscription = manageService.manageId$.subscribe((manageId) => {
        setmanageId(manageId);
      });
      return () => {
        subscription.unsubscribe();
      };
    }, []);

    const addManageId = () => {
      manageService.setManageId(manageId + 1);
    };
    return (
      <div>
        <div>
          <span>I am manage, manageId: {manageId}</span>{" "}
          <button onClick={addManageId}>add manageId</button>
        </div>
        <User></User>
        <User></User>
      </div>
    );
  }
  ```

# 链接

Github 地址：https://github.com/darkeering/hooks-context-state-dar
