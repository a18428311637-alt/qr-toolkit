# QR Toolkit

一个基于 Electron 的极简现代风二维码工具，支持**生成**和**识别**二维码。

![Electron](https://img.shields.io/badge/Electron-28-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## 功能

- **生成二维码**：输入文字或 URL，一键生成二维码并保存为 PNG 图片
- **识别二维码**：点击选择或拖拽本地图片，自动识别其中的二维码内容，支持一键复制

## 技术栈

| 技术 | 用途 |
|------|------|
| Electron | 桌面应用框架 |
| qrcode | 二维码生成 |
| jsqr | 二维码识别 |
| electron-builder | 打包构建 |

## 项目结构

```
qr-toolkit/
├── main.js                   # 主进程（窗口管理 + IPC）
├── preload.js                # 预加载脚本（安全 IPC 桥接）
├── index.html                # 界面结构
├── renderer.js               # 渲染进程逻辑
├── style.css                 # 极简现代风样式
├── package.json              # 依赖与构建配置
├── .github/workflows/release.yml  # GitHub Actions 自动发布
└── .gitignore
```

## 快速开始

### 环境要求

- Node.js >= 18
- npm

### 安装依赖

```bash
npm install
```

### 开发运行

```bash
npm start
```

### 打包构建

构建 Windows 安装包：

```bash
npm run dist
```

产物输出到 `release/` 目录。

## 使用方式

### 生成二维码

1. 在顶部 Tab 栏选择「生成二维码」
2. 在输入框中输入文字或 URL
3. 点击「生成二维码」按钮
4. 预览区将显示生成的二维码
5. 点击「保存图片」按钮，选择保存路径即可下载 PNG 文件

### 识别二维码

1. 在顶部 Tab 栏选择「识别二维码」
2. 点击虚线区域选择图片，或直接将图片拖拽到该区域
3. 识别结果将显示在右侧卡片中
4. 点击「复制到剪贴板」按钮复制识别内容

## 自动发布

项目配置了 GitHub Actions，推送 `v*` 格式的 tag 时自动构建并发布到 GitHub Releases：

```bash
git tag v1.0.0
git push origin v1.0.0
```

## License

MIT
