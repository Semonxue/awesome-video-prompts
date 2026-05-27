# Markdown 可视化编辑器

一个轻量的本地工具，用于可视化编辑视频提示词的 Markdown 文件，并预览关联的素材。

## 功能特点

- 📋 **三栏布局**：左侧文件列表 / 中间编辑区 / 右侧来源预览
- ✏️ **可视化编辑**：编辑 Front Matter 字段
- 👁 **实时预览**：Markdown 内容预览
- 🎬 **素材预览**：封面图和视频直接预览
- 🔗 **来源查看**：点击按钮在右侧 iframe 打开原链接
- 💾 **一键保存**：修改后保存到文件系统

## 界面布局

```
┌──────────────┬──────────────────────────────┬──────────────┐
│  📁 待编辑   │  标题 / 模型 / 标签 / 来源    │   来源页面   │
│   文件列表    │  封面图 │ 视频               │   (iframe)   │
│   (25%)      │  描述内容                   │    (25%)     │
│              │  描述内容                   │              │
│  · file1.md │  描述内容                   │              │
│  · file2.md │                              │              │
│  · file3.md │         [👁 预览] [💾 保存]   │              │
└──────────────┴──────────────────────────────┴──────────────┘
```

## 使用方法

### 1. 启动服务器

```bash
cd tools/md-editor
python server.py
```

默认端口 3000，如需更换端口：

```bash
python server.py 8080
```

### 2. 访问编辑器

打开浏览器访问：`http://localhost:3000`

### 3. 编辑文件

1. **点击左侧文件**：加载文件内容
2. **草稿目录约定**：草稿 Markdown 位于 `content/_drafts/prompts/YYYY-MM/slug.md`，对应素材位于 `static/_drafts/prompts/YYYY-MM/slug/`
2. **编辑标题**：英文标题，3-7 个单词
3. **选择模型**：点击模型标签选择
4. **填写标签**：逗号分隔，如 `cinematic, advertisement, car`
5. **填写来源**：粘贴原链接，点击 🔗 来源 在右侧预览
6. **预览素材**：封面图和视频自动加载
7. **编辑描述**：输入完整提示词内容
8. **点击保存**：生成正确的 Front Matter 格式；保持 `draft: true` 时只保存草稿内容，切换为 `draft: false` 时会同时迁移 Markdown 和素材到正式目录
9. **失败保护**：如果保存过程中素材迁移失败，编辑器会保留原草稿文件和原素材目录，并返回错误信息

### 4. 提交到仓库

```bash
git add content/prompts/2026-04/xxx.md
git commit -m "feat: 添加 xxx 提示词"
git push
```

## 技术栈

- **后端**：Python 标准库（零依赖）
- **前端**：原生 HTML/CSS/JavaScript
- **Markdown 渲染**：marked.js (CDN)
- **布局**：响应式三栏布局
- **主题**：浅色模式

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/files` | 获取未提交文件列表 |
| GET | `/api/file?path=xxx` | 读取文件内容 |
| PUT | `/api/file` | 保存文件 |
| GET | `/api/metadata?type=models` | 获取模型列表 |
| GET | `/api/metadata?type=tags` | 获取标签列表 |
