# TMDB 电影精选 · Rex / Forward 模块

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
