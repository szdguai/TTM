## 项目说明

这是从单文件 `00.html` 拆解出的可在线部署的静态项目结构：

```
A/
├─ 00.html               # 入口页面（可重命名为 index.html 以便直接访问）
├─ assets/
│  ├─ css/
│  │  └─ styles.css      # 原内联 <style> 已抽取
│  └─ js/
│     └─ app.js          # 原页面底部大段 <script> 已抽取
└─ README.md
```

外部依赖通过 CDN 引入：
- Bootstrap 5（CSS/JS）
- Chart.js
- SheetJS (xlsx)

如果需要离线部署，可将这些 CDN 资源改为本地文件并更新 `00.html` 中的 `<link>`/`<script>` 地址。

## 本地预览

使用任意静态服务器在该目录启动（避免直接用文件协议打开导致某些浏览器安全策略限制）。

示例（Node）：
```bash
npx serve .
```

示例（Python）：
```bash
python -m http.server 8080
```

然后访问：
- 如果保持文件名为 `00.html`：`http://localhost:8080/00.html`
- 若重命名为 `index.html`：直接访问根路径 `http://localhost:8080/`

## 在线部署（三选一）

1) GitHub Pages（纯静态）
- 将本目录提交到 GitHub 仓库根目录
- Settings → Pages → Branch 选择 `main/(root)` 保存
- 若将 `00.html` 改名为 `index.html`，访问 `https://<user>.github.io/<repo>/`
- 若保留 `00.html`，访问 `https://<user>.github.io/<repo>/00.html`

2) Vercel（推荐，零配置）
- 新建项目指向该目录，框架选择“其他”，构建/输出目录使用根目录
- 部署完成后直接访问分配域名（同上关于 `index.html` 的规则）

3) Nginx（自托管）
示例站点配置：
```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/A;
    index index.html 00.html;

    location / {
        try_files $uri $uri/ /00.html;
    }
}
```

## 注意事项
- 如果你看到样式或交互未生效，请确认：
  - `assets/css/styles.css` 与 `assets/js/app.js` 能被正确加载
  - 访问环境可访问 CDN 域名（国内网络可能需自备可用镜像）
- 如需完全去除内联脚本，请确保 `app.js` 中逻辑完整，随后删除 `00.html` 底部保留的内联脚本段。

## 进一步优化（可选）
- 将 `00.html` 重命名为 `index.html`，便于默认访问
- 将 CDN 改为固定版本或私有镜像，保证可用性
- 使用构建工具（Vite/webpack/Parcel）进行资源指纹与压缩


