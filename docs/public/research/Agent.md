# Acknowledge Research Publishing Guide

## 目的

这个文件是给后续 AI agent 的维护说明，不是研究成果，不要加入成果列表，不要作为 VitePress 页面渲染。

当前站点使用 VitePress 做导航、归档和搜索壳子。研究成果文件放在静态目录里，点击后交给浏览器原样打开。

## 目录约定

```text
docs/
  index.md
  research/
    index.md
    manifest.json
  public/
    research/
      Agent.md
      <report>.html
      <report>.md
      <report>.pdf
      <report>.pptx
      <multi-page-report>/
        index.html
        section-1.html
scripts/
  sync-research-manifest.mjs
  build-search-index.mjs
```

## 新增成果

把最终成果文件放到 `docs/public/research/`。

支持任意浏览器能处理的文件类型，例如 HTML、Markdown、PDF、PPT/PPTX、图片等。不要把成果文件放回 `docs/research/`，那里只放 VitePress 页面和 manifest。

多页 HTML 成果使用目录形式：

```text
docs/public/research/my-report/
  index.html
  section-1.html
  section-2.html
```

manifest 脚本会把带 `index.html` 的目录当作一个成果入口。

## HTML 元信息

HTML 成果应尽量在 `<head>` 里提供这些字段：

```html
<meta name="page-title" content="列表里显示的标题">
<meta name="description" content="列表里显示的摘要">
<meta name="keywords" content="标签1, 标签2, 标签3">
<meta name="page-category" content="Research">
<meta name="page-date" content="2026-05-28">
```

`page-title` 可选；没有时会用 `<title>`。

`page-date` 推荐使用 `YYYY-MM-DD`。脚本也会尝试识别：

- `<meta name="date" content="2026-05-28">`
- `<meta name="publish-date" content="2026-05-28">`
- `<meta name="published" content="2026-05-28">`
- `<meta name="created" content="2026-05-28">`
- `<meta name="updated" content="2026-05-28">`
- `<meta property="article:published_time" content="2026-05-28">`
- `<time datetime="2026-05-28">`
- 正文中的 `研究日期: 2026-05-28`、`报告日期: 2026-05-28`、`发布日期: 2026-05-28`

不要用文件修改时间当成果日期。抽不到日期就留空。

## Markdown 元信息

Markdown 成果如果要显示日期，在 frontmatter 中写：

```markdown
---
date: 2026-05-28
---
```

第一行 `# 标题` 会作为成果标题。

## 不要展示的文件

`Agent.md` 是维护说明，已在 `scripts/sync-research-manifest.mjs` 中忽略。不要把它恢复进成果列表。

辅助图片目录 `images/`、`assets/`、兼容目录 `research/` 也不作为成果入口。

## 构建与验证

本地生成 manifest、构建 VitePress、生成 Pagefind 索引：

```bash
npm run docs:build
```

本地预览：

```bash
npm run docs:preview
```

检查点：

- `/research/` 能看到成果列表。
- 成果按日期倒序排列；无日期的排在后面。
- 搜索框能搜 HTML 正文、Markdown 内容、标题和标签。
- 点击成果后直接打开 `/research/...` 下的静态文件。
- `Agent.md` 不出现在成果列表里。
- `docs/.vitepress/dist/pagefind/pagefind.js` 存在。
- `docs/.vitepress/dist/research/` 下存在成果文件。

模拟 GitHub Pages 子路径构建：

```bash
GITHUB_ACTIONS=true GITHUB_REPOSITORY=yyzxw/acknowledge npm run docs:build
```

构建产物中的站点资源路径应带 `/acknowledge/` 前缀。

## GitHub Pages

部署工作流在 `.github/workflows/deploy.yml`。

push 到 `main` 后，GitHub Actions 会：

1. 安装 npm 依赖。
2. 执行 `npm run docs:build`。
3. 上传 `docs/.vitepress/dist`。
4. 由 GitHub Pages 发布。

不要主动 commit 或 push，除非用户明确要求。
