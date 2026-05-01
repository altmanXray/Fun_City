# LittleGame - 游戏平台

一个在线游戏平台，支持多种益智游戏。

## 🎮 游戏列表

### 舒尔特方格
- **经典模式** - 5×5 方格训练
- **标准模式** - 可选 3×3 到 9×9 难度
- **唐诗模式** - 30首古诗词训练，带拼音显示
- 支持历史记录对比
- 标准模式和唐诗模式有下一关功能

### 数独
- **4种难度**：简单、中等、困难、专家
- 自动生成有效的数独谜题
- 智能提示功能
- 错误次数限制（3次）
- 相关数字高亮显示
- 计时功能
- 最佳记录对比

## 📁 项目结构

```
Little-game/
├── index.html              # 游戏大厅主页面
├── style.css               # 大厅样式
├── script.js               # 大厅脚本
├── games/
│   ├── schulte/            # 舒尔特游戏
│   │   ├── index.html
│   │   ├── style.css
│   │   └── script.js
│   └── sudoku/             # 数独游戏
│       ├── index.html
│       ├── style.css
│       └── script.js
├── README.md
└── 启动服务器.bat
```

## 🚀 快速开始

### 一键启动（推荐）⭐
双击 `一键启动.bat`
- 自动启动服务器
- 自动打开浏览器
- 最简单快捷

### 其他启动方式
1. **启动服务器.bat** - 手动启动，查看日志
2. **停止服务器.bat** - 快速停止服务器
3. **直接打开** - 用浏览器打开 index.html（功能受限）

### 本地服务器
手动运行：
```bash
python -m http.server 8080
```

### 详细说明
查看 [服务器使用说明.md](服务器使用说明.md)

## 🌐 部署到 GitHub Pages

1. 将代码推送到 GitHub
2. 进入仓库 **Settings** → **Pages**
3. Source 选择 **Deploy from a branch**
4. Branch 选择 **main**，文件夹选 **/ (root)**
5. 访问：`https://你的用户名.github.io/Little-game/`

## ✨ 功能特性

- 响应式设计，支持移动端
- 本地存储历史记录
- 游戏计时功能
- 结算弹窗
- 历史记录对比
- 支持扩展更多游戏

## 🔧 技术栈

- HTML5
- CSS3
- Vanilla JavaScript
- LocalStorage

## 📝 开发计划

- [ ] 添加更多游戏
- [ ] 添加排行榜
- [ ] 添加成就系统
- [ ] 添加音效和背景音乐

## 📄 许可证

MIT License