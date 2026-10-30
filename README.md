# Rex / Forward 电影精选模块

个人首个vibecoding项目

两个独立模块，数据源来源TMDB&豆瓣评分 无需在脚本中填写 API Key。

## 豆瓣高分电影精选 · 1.1.0

包含 **高分华语电影、高分粤语电影、高分外语电影**。默认最低豆瓣评分 8 分，支持调整最低评分与分页。

### 效果预览

![豆瓣高分电影精选：华语、外语、粤语三分类在 Rex 中的实际效果](assets/douban-preview.jpg)

用户提供的 Rex 实机截图（2026-10-30）。拼贴卡片是 Rex 首页配置的展示样式，模块提供分类数据；仅导入脚本不会自动创建截图中的首页布局。

### 导入

复制以下链接，在 Rex 的「设置 → 模块 → 通过链接添加」中导入：

```text
https://raw.githubusercontent.com/ZurlyQin/rex-widgets/main/douban-movie-collections.js
```

[下载豆瓣模块](https://raw.githubusercontent.com/ZurlyQin/rex-widgets/main/douban-movie-collections.js) · [详细使用说明](DOUBAN.md)

导入后打开「资源库 → 豆瓣高分电影精选」。已有同 ID 旧版时选择覆盖；如仍出现旧数据，清理模块缓存并重新启动 Rex。

- **筛选和排序采用豆瓣评分**，海报、背景图和电影详情使用 TMDB。仅保留片名与年份一致且匹配唯一、有海报的条目，因此结果是豆瓣榜单的子集。
- Rex 标注为 TMDB 的分数是真正的 TMDB 分数。豆瓣分数写在模块返回的简介中，内置详情页重新加载后可能替换该简介。
- 华语、粤语按豆瓣标签分类；外语按出品地区近似排除中国大陆、香港、台湾、澳门，并非严格原声语言分类。
- 首次加载需匹配影片，可能较慢。豆瓣标为电影的特别篇或舞台录像可能混入；模块不提供播放源。

### 验证

2026-10-30 在 Rex 实机验证三个分类的海报、首页拼贴与电影详情；离线测试覆盖分页、过滤、缓存、字段映射及海报匹配歧义处理。

```sh
node test-douban.cjs
```

---

## TMDB 电影精选

文件：`tmdb-movie-collections.js`。单文件模块，包含五个可独立使用的分类，所有影片资料均通过 Rex 内置 `Widget.tmdb.get` 获取。不需要在脚本中填写 API Key。

| 分类 | 筛选与排序 | 默认最低评价人数 |
| --- | --- | --- |
| 最新华语电影 | 原始语言普通话（zh）或粤语（cn），首次上映日期由新到旧 | 10 |
| 最新外语电影 | 排除 zh、cn、无语言标记，首次上映日期由新到旧 | 10 |
| 高分华语电影 | zh 或 cn，TMDB ≥ 7 分，评分由高到低 | 100 |
| 高分香港电影 | TMDB 出品地区 HK（包含合拍片），TMDB ≥ 7 分，评分由高到低 | 100 |
| 高分外语电影 | 排除 zh、cn、无语言标记，TMDB ≥ 7 分，评分由高到低 | 500 |

“华语”按 TMDB 的原始语言标签判定；影片只会有一个原始语言标签，可能无法完整表达方言及多语言影片。“香港”按出品地区判定，因此会与华语榜交叉。

全部分类排除成人条目和未来上映影片。日期上限按北京时间当天自动更新。“最新”采用 TMDB 的首次上映日期，不代表中国大陆上映日、上线流媒体日期或已有可播放资源。

每页 20 部。普通话和粤语两路数据先合并排序再分页；外语榜过滤后继续请求补足一页。支持资料语言、最低评价人数，以及高分榜的最低评分调整。数据缓存 30 分钟；更换筛选条件会重新加载。TMDB 单路接口最多支持 500 页。

## 使用

[模块下载 / Raw 直链](https://raw.githubusercontent.com/ZurlyQin/rex-widgets/main/tmdb-movie-collections.js)

将此链接粘贴到 Rex 的“设置 → 模块 → 通过链接添加”：

```text
https://raw.githubusercontent.com/ZurlyQin/rex-widgets/main/tmdb-movie-collections.js
```

下载本仓库的 `tmdb-movie-collections.js`，在 Rex 的“设置 → 模块 → 添加文件”中导入，然后打开“资源库 → TMDB 电影精选”即可浏览五个分类。也可复制脚本的 Raw 链接，通过“设置 → 模块 → 通过链接添加”导入。

点击电影会使用 Rex 内置 TMDB 详情页。此模块提供影片发现与资料；播放由 Rex 已连接的资源库负责。

## Based on

- [Forward 官方仓库与示例](https://github.com/InchStudio/ForwardWidgets)
- [Forward Widget 开发者指南](https://forward-2.gitbook.io/forward/fu-lu-er-forward-widget-kai-fa-zhe-zhi-chi)
- [TMDB Discover Movie 接口](https://developer.themoviedb.org/reference/discover-movie)

本模块为自定义模块，非TMDB或Rex官方模块。

## 验证结果（2026-10-29）

- Rex 实机：文件导入成功，五个分类均返回真实 TMDB 列表。
- 高分香港电影：向下滚动后续载第二页；抽查影片“小Q”能打开内置详情页并显示简介和评分。
- 高分外语电影：20 部影片及海报显示正常，包含《肖申克的救赎》《教父》等。
- 本地断言：验证五分类请求条件、普通话/粤语跨页合并、外语过滤补页、去重、缓存命中、筛选条件切换、字段映射、空数据、网络异常、非法页码、无缓存跳页。
- 测试有效性：将海报字段故意改错的临时副本会触发断言失败；交付文件未应用该错误。

## 本地测试

需要 Node.js 18 或更高版本，无第三方依赖：

```sh
node test-widget.cjs
```

离线测试模拟 Rex 的 Widget API；真实网络与海报展示由 Rex 实机验证。
