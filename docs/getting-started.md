# Getting Started

## 安装依赖

```bash
pip install mkdocs mkdocs-material
```

## 本地开发

```bash
mkdocs serve
```

## 添加新页面

在 `docs/` 目录下创建新的 `.md` 文件，然后更新 `mkdocs.yml` 中的 `nav` 部分。

## HTML 支持示例

### 内嵌 HTML

<div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
  <h3 style="color: #333;">自定义 HTML 块</h3>
  <p>这是一段在 Markdown 中嵌入的 <strong>HTML</strong> 内容。</p>
  <button onclick="alert('Hello from HTML button!')" style="padding: 8px 16px; cursor: pointer;">
    点击我
  </button>
</div>

### 嵌入 iframe

<iframe
  width="100%"
  height="400"
  src="https://example.com"
  frameborder="0"
  style="border: 1px solid #ddd; border-radius: 4px;">
</iframe>
