# Welcome to AI Docs Template

这是一个使用 **MkDocs** + **GitHub Pages** 部署的静态文档站点。

## 工作流

```
AI 生成 Markdown → Push 到 GitHub → 自动构建部署 → 公网访问
```

## 快速开始

### 1. 编写内容

在 `docs/` 目录下创建 `.md` 文件：

```markdown
# 我的文章

这是 AI 生成的内容。

<div style="color: blue">
  也可以写 <strong>HTML</strong>
</div>
```

### 2. 本地预览

```bash
pip install mkdocs mkdocs-material
mkdocs serve
```

访问 http://localhost:8000 预览。

### 3. 发布到 GitHub

```bash
git add .
git commit -m "Add new content"
git push origin main
```

GitHub Actions 会自动构建并部署到 GitHub Pages。

## 支持的功能

- ✅ Markdown 语法
- ✅ 内嵌 HTML
- ✅ 纯 HTML 文件（放在 docs/ 目录直接复制）
- ✅ 代码高亮
- ✅ 搜索功能
- ✅ 响应式布局

## 访问地址

部署完成后访问：
**https://yyzxw.github.io/ai-docs-template/**
