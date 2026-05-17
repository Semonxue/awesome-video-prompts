任务：将下载的 X 视频转换为 Hugo 提示词内容（优化版）

### 输入上下文：
- 先使用x帖子地址判断是否已经重复存在（一定要全字段匹配）
- 使用 tools/dl-x-videos.py + x帖子地址 下载视频及元数据，存储在 temp/<TWEET_ID>/ 目录。
- temp/<TWEET_ID>/ 目录包含：info.json, video.mp4 (原画), preview_480p.mp4 (预览), video.jpg。
- 检查在prompts中是否已经存在了<TWEET_ID>对应的资源，已经存在的话则提示用户
- 如果下载出错，重试2次
- 如果帖子中提到提示词在回复中，则拉取回复内容，提取完整提示词（不要改写、不要提炼，如果是json格式则保持），所有收集到的信息存入 full_text字段

### 解析元数据 (Analyze Metadata)

- 读取 info.json。
- 提取：post_id, full_text, author_name, url, post_date (格式 YYYYMMDD)。

### 规划路径与归档 (Path Strategy)

- 年月目录: 解析 post_date 提取 YYYY-MM (例如 2026-02)。
- Slug 生成: <TWEET_ID>-kebab-video-description (例如: 2017923383401259008-dynamic-fpv-forest)。
- 资源目录: static/prompts/<YYYY-MM>/<Slug>/。
- 内容文件: content/prompts/<YYYY-MM>/<Slug>.md。

### 处理静态资源 (Asset Management)

- 创建目录：mkdir -p static/prompts/<YYYY-MM>/<Slug>
- 迁移封面图：cp temp/<TWEET_ID>/video.jpg static/prompts/<YYYY-MM>/<Slug>/cover.jpg
- 迁移视频 (仅预览版)：
- cp temp/<TWEET_ID>/preview_480p.mp4 static/prompts/<YYYY-MM>/<Slug>/video.mp4
- 把封面图尺寸宽度压缩到长边不大于600px，保持比例，使用ImageMagick把图片压缩到60%的jpg，大小控制在30k之内
- 把视频压缩到480p，体积控制在1M之内
(注：优先使用生成的 480p/preview 版本以节省带宽，若无预览版则使用原版)

### 生成 Markdown 内容 (Content Generation)

- 创建文件：content/prompts/<YYYY-MM>/<Slug>.md
- 关键 Front Matter 字段(务必不要写错)：
  - image: /prompts/<YYYY-MM>/<Slug>/cover.jpg
  - video: /prompts/<YYYY-MM>/<Slug>/video.mp4
  - date: 转换时间格式。
  - title: 从 full_text 中提取简短标题，确保语义完整且吸引人,3-7个单词，不包含模型名，英文。
  - description: 分析 full_text 中内容，提取完整的提示词。不要有遗漏、截取或提炼，不要翻译，如果full_text中内容部完整，看下上下文是否有线索。多行内容必须使用 YAML 多行语法 `description: |` 后换行缩进书写，避免使用转义字符 \n，清除内容中所有独立行的“---”。
  - models: 自动匹配，提取1个视频模型，并优先使用 data/models.yaml 中的模型关键词。
  - tags: 自动匹配，tags选择最匹配的，，不要超过5个，tags不要包含model,优先选择 data/tags.yaml中的标签，如典型必要不增加新的标签,使用 [xxx,bbb,xxx...] 的数组形式。
  - author： 原始帖子作者
  - source_url: 原始帖子链接 (注意：不要使用 url 字段，因为它是 Hugo 保留字段)。
  - 如果新增标签或模型，在data中models和tags加更新
  - 默认加入draft: true 字段
  - 结尾以“---”结束

### 清理与验证 (Cleanup)
- 删除临时目录：rm -rf temp/<TWEET_ID>。
- 验证生成文件的 Front Matter 路径是否正确包含 <YYYY-MM>
- 运行 ./tools/start-md-editor.sh 并打开浏览器 http://localhost:3000/ 提供审核