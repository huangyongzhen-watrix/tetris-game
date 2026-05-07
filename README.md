# 简易俄罗斯方块

一个纯前端的俄罗斯方块小游戏，不需要后端和构建工具。

## 本地运行

直接用浏览器打开 `index.html`，或在当前目录启动一个静态服务：

```bash
python3 -m http.server 8000
```

然后访问：

```text
http://localhost:8000
```

## 操作方式

- `←` / `→`：左右移动
- `↑`：旋转
- `↓`：加速下落
- `空格`：直接落下
- `P`：暂停 / 继续
- `Enter`：游戏结束后重新开始

## 发布到 GitHub Pages

1. 在 GitHub 新建一个仓库，例如 `tetris-game`。
2. 把本目录的文件推送到仓库的 `main` 分支。
3. 进入仓库的 `Settings` -> `Pages`。
4. 在 `Build and deployment` 中选择 `Deploy from a branch`。
5. 分支选择 `main`，目录选择 `/root`，保存。
6. 稍等片刻后，GitHub Pages 会给出一个公网地址。

