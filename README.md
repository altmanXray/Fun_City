# LittleGame - 游戏平台

一个在线游戏平台，支持多种益智游戏。

## 🎮 游戏列表

### 舒尔特方格
- **经典模式** - 5×5 方格训练
- **标准模式** - 可选 3×3 到 9×9 难度
- **唐诗300首** - 300 首简体唐诗，逐字带拼音显示，按诗句顺序点击，由易到难排列
- 支持历史记录对比
- 标准模式和唐诗模式有下一关功能

### 数独
- **4种难度**：简单、中等、困难、专家
- 自动生成有效的数独谜题，**保证唯一解**
- 智能提示功能
- 错误次数限制（3次）
- 相关数字高亮显示
- 计时功能
- 最佳记录对比

### 记忆翻牌
- **3种难度**：简单、中等、困难
- 翻牌配对玩法
- 计时和步数统计
- 最佳记录保存

### 2048
- 标准 4×4 合并玩法
- 支持键盘方向键和移动端滑动
- 支持撤销一步
- 最高分保存

### 五子棋
- 19×19 标准棋盘，人机（启发式 AI）/ 双人两种模式
- 悔棋带次数统计（人机模式一次回退两手），终局后悔棋置灰
- 落败结算按悔棋次数分档吐槽，终局连珠五子红线高亮且不遮挡棋盘
- 计时和最快获胜记录

## ✨ 平台功能

- **玩家档案** - 本地多玩家支持：设置昵称、同设备切换/新建/删除档案，记录按玩家归属（数据保存在本机浏览器）
- **排行榜** - 每个游戏独立榜单（按模式/难度细分），自动记录本地 Top10；大厅可查看全部，游戏页内也有本游戏榜单入口
- **成就系统** - 21 个成就（首胜、唐诗进度、数独全难度、2048 里程碑等），解锁弹提示，带进度显示
- **音效与背景音乐** - Web Audio 实时合成，轻快的大调五声拨弦循环，各页面均可开关，偏好跨页面记忆
- 响应式设计，支持移动端
- 结算弹窗与历史记录对比

## 📁 项目结构

```
Little-game/
├── index.html              # 游戏大厅主页面
├── style.css               # 大厅样式
├── script.js               # 大厅脚本
├── assets/                 # 共享资源
│   ├── theme.css           # 统一主题与通用组件
│   ├── util.js             # 计时/记录工具
│   ├── audio.js            # 音效与背景音乐
│   ├── player.js           # 玩家档案
│   └── features.js         # 排行榜/成就/共享 UI
├── games/
│   ├── schulte/            # 舒尔特方格（含 poems-tang300.json 诗库）
│   │   ├── index.html
│   │   ├── style.css
│   │   └── script.js
│   ├── memory/             # 记忆翻牌
│   ├── sudoku/             # 数独
│   ├── 2048/               # 2048
│   └── gomoku/             # 五子棋
├── tools/                  # 离线构建工具（不参与游戏运行时）
│   ├── build-poems.js      # 生成简体+拼音诗库（见下）
│   ├── verify-poems.js     # 诗库质检
│   └── verify-sudoku.js    # 数独唯一解验证
├── local-server.js         # Node 本地静态服务器
└── README.md
```

## 📜 唐诗诗库说明

`games/schulte/poems-tang300.json` 收录 300 首简体唐诗（含逐字带调拼音），由 `tools/build-poems.js` 离线生成，按难度排序（字数 → 生僻字比例）并裁剪至 300 首：

- 选目来自 [chinese-poetry](https://github.com/chinese-poetry/chinese-poetry) 的《唐诗三百首》（仅取收录清单，其繁体正文一律弃用）
- 正文全部取自简体《全唐诗》语料（npm 包 `tangshi`），**全程不做繁体转简体**
- 拼音由 [pinyin-pro](https://github.com/zh-follower/pinyin-pro) 上下文感知注音，生成时逐首校验"音节数与汉字数一致"

重新生成（需要网络与 Node.js）：

```bash
cd tools
npm install
npm run build:poems
```

## 🚀 快速开始

### 本地服务器
推荐使用项目自带的 Node 静态服务器：
```bash
node local-server.js
```

访问：
```bash
http://127.0.0.1:8080
```

也可以用 Python 启动，但当前电脑的 Python 环境不可用：
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

## 🔧 技术栈

- HTML5
- CSS3
- Vanilla JavaScript
- Web Audio API（音效/背景音乐合成）
- LocalStorage

## 📝 开发计划

- [x] 添加排行榜
- [x] 添加成就系统
- [x] 添加音效和背景音乐
- [x] 唐诗300首简体+拼音
- [ ] 添加更多游戏

## 📄 许可证

MIT License
