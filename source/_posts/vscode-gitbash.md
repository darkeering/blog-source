---
title: vscode的终端设置成gitbash
date: 2023-02-09 22:44:30
tags: ['vscode']
---

1. 打开 vscode 设置

2. 点击右上角转成 json 格式

3. 添加代码

   ```typescript
   "terminal.integrated.profiles.windows": {
       "gitBash": {
           "path": "D:\\soft\\Git\\bin\\bash.exe", //本地bash程序的路径
       }
   },
   "terminal.integrated.defaultProfile.windows": "gitBash",
   ```

4. 回到设置，搜索 shell windows，在以下的下拉框中选择 gitbash
   ![vscode-gitbash-1](/assets/vscode-gitbash/vscode-gitbash-1.png)

5. 重新打开终端就能看见了，如果不行就重启 vscode
   ![vscode-gitbash-2](/assets/vscode-gitbash/vscode-gitbash-2.png)
