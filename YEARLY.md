# 年度高分电影 · 2020—2025

导入文件：`tmdb-yearly-top-movies.js`。这是一个完整的 Rex / Forward Widget，无需安装其他依赖，也无需在脚本中填写 API Key；网络请求使用 Rex 内置的 TMDB 接口。

## 使用

1. Rex → 设置 → 模块 → 添加文件，选择上述 JS 文件。
2. 进入「资源库」→「年度高分电影 · 2020—2025」。
3. 点击「年度高分电影」标题旁的箭头展开完整榜单。
4. 点击「上映年份筛选」选择 2020、2021、2022、2023、2024 或 2025，默认 2025。
5. 向下滚动加载更多；点击海报进入 Rex 内置的电影详情页。

## 榜单口径

- 数据源：TMDB；按 TMDB 当前平均评分从高到低排序。
- 至少 500 人评分，不额外加入热度或语言限制。
- 年份按 TMDB 的主要上映年份筛选，不按中国大陆上映日期筛选。
- 使用简体中文标题和简介；缺少中文标题时回退至原片名。
- 保持服务端排序和分页，同分电影沿用 TMDB 顺序。
- 使用 TMDB 默认成人内容和视频条目排除规则。
- 缓存为一小时；评分会随 TMDB 数据更新，不是历史年终榜单快照。
- 模块提供电影榜单与详情入口；播放资源由你的 Rex 资源库提供。

## 本地测试

在项目目录运行 `node test-yearly-top-movies.cjs`。测试无需联网或第三方依赖，覆盖六年筛选、500 票门槛、降序参数、分页、字段映射、空页和错误处理。

## 参考

- [Forward 官方示例](https://github.com/InchStudio/ForwardWidgets)
- [Forward 开发者支持](https://forward-2.gitbook.io/forward/fu-lu-er-forward-widget-kai-fa-zhe-zhi-chi)
- [TMDB Discover Movie](https://developer.themoviedb.org/reference/discover-movie)

This product uses the TMDB API but is not endorsed or certified by TMDB.
