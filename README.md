# Frontend — 研究成果展示页

静态单页应用，基于 ECharts 的可视化展厅。

## 文件

```
frontend/
├── index.html          主页面（9 个章节）
├── styles.css          学术风格样式（深蓝 + 墨绿）
├── script.js           ECharts 图表 + 中国地图
├── images/             图片资源
└── 部署指南.md         详细部署步骤
```

## 本地预览

```bash
cd frontend
python -m http.server 8000
# 访问 http://localhost:8000
```

## 部署到 Vercel

仓库根目录的 `vercel.json` 已配置 `outputDirectory: "frontend"`，Vercel 会自动识别。

详见 `部署指南.md`。

## 外部依赖（运行时从 CDN 加载）

| 资源 | 来源 |
|------|------|
| ECharts 5.4.3 | jsdelivr |
| Cormorant Garamond | Google Fonts |
| 中国地图 GeoJSON | DataV.GeoAtlas（审图号 GS(2019)1822） |
