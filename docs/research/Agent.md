# Research Reports — AI Agent Guide

## 项目概述

静态文档站点，存放 AI / 云原生领域的技术调研报告。所有页面是纯 HTML，零构建步骤，零依赖。

## 目录结构

```
docs/
  index.html                 ← 首页，链接到 research/list.html
  research/
    list.html                ← 报告列表页（动态渲染，不用手动维护）
    Agent.md                 ← 本文件
    <report-name>.html       ← 研究报告（添加新文件即可自动发现）
    <report-dir>/            ← 多页报告子目录
      index.html
      section-1.html
      ...
```

## 添加新报告

**只需两步：**

1. 创建 HTML 文件放到 `research/` 目录下
2. 在 `<head>` 中添加以下 meta 标签：

```html
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>页面标题（浏览器标签栏显示）</title>
  <!-- 以下为必填 meta 标签 -->
  <meta name="description" content="卡片上显示的摘要描述">
  <meta name="keywords" content="标签1, 标签2, 标签3">
  <meta name="page-category" content="Research"><!-- Research | Report | Guide -->
  <meta name="page-color" content="blue">      <!-- red | green | blue | purple -->
```

**不需要：**
- 不需要修改 `list.html`
- 不需要修改 `index.html`
- 不需要运行任何脚本
- 不需要维护任何清单文件

## 页面工作原理

`research/list.html` 启动时：

1. `fetch('./')` → 获取目录列表（因为目录下没有 `index.html`，HTTP 服务器返回目录列表）
2. 解析目录列表中的 `<a href>`，筛选所有 `.html` 文件（排除自身 `list.html`）
3. 对每个文件 `fetch()` → 解析 `<meta>` 标签 → 提取标题、描述、标签、分类、颜色
4. 动态渲染卡片网格：样式、颜色、标签 pills
5. 从卡片 pills 中提取所有标签 → 生成标签筛选按钮
6. 同时缓存每篇报告的纯文本内容 → 供全文搜索使用

**搜索：** 输入关键词 → 在缓存文本中 `indexOf()` 匹配 → 按相关度打分排序 → 显示结果片段（隐藏卡片网格）。清空搜索框后恢复网格。

## Meta 标签规范

| 标签 | 必填 | 说明 |
|------|------|------|
| `page-title` | 否 | 卡片标题（不填则使用 `<title>` 标签内容） |
| `description` | 是 | 卡片摘要，一句话概括报告内容 |
| `keywords` | 是 | 逗号分隔的标签，会渲染为卡片底部的 pill |
| `page-category` | 是 | 分类标签文字：`Research` / `Report` / `Guide` |
| `page-color` | 是 | 卡片颜色：`red` / `green` / `blue` / `purple` |

**何时使用 `page-title`：** 当 `<title>` 内容较长或带副标题，而卡片上希望显示简短标题时。

## 多页报告

如果报告有多个页面（如 `vllm-concepts-deep-dive/`），创建一个目录并在其中放 `index.html` 作为入口页。目录路径要以 `/` 结尾（如 `vllm-concepts-deep-dive/`），`list.html` 会自动检测目录并加载其 `index.html`。

## 本地预览

```bash
cd docs
python3 -m http.server 8080
open http://localhost:8080/research/list.html
```

必须通过 HTTP 服务访问，`file://` 协议下 `fetch()` 会因 CORS 限制失败。

## 部署注意

- 依赖服务器返回目录列表（`research/` 下不能有 `index.html`）
- Python http.server、nginx（autoindex）、Apache（Options +Indexes）均支持
- 如果部署平台禁止目录列表（如 GitHub Pages），需要改用其他方案
