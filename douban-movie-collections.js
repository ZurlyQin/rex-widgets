WidgetMetadata = {
  "id": "rex.douban.julian.moviecollections",
  "title": "豆瓣高分电影精选",
  "version": "1.1.0",
  "requiredVersion": "0.0.1",
  "description": "豆瓣真实评分：华语、粤语、外语。外语按出品地区近似筛选；华语与粤语按豆瓣标签。",
  "author": "Julian",
  "site": "https://movie.douban.com",
  "modules": [
    {
      "id": "doubanChinese",
      "title": "高分华语电影",
      "functionName": "doubanChinese",
      "description": "豆瓣华语标签；包含粤语电影。",
      "cacheDuration": 0,
      "requiresWebView": false,
      "params": [
        {
          "name": "page",
          "title": "页码",
          "type": "page"
        },
        {
          "name": "minRating",
          "title": "最低豆瓣评分",
          "type": "enumeration",
          "value": "8",
          "enumOptions": [
            {
              "title": "7 分",
              "value": "7"
            },
            {
              "title": "7.5 分",
              "value": "7.5"
            },
            {
              "title": "8 分",
              "value": "8"
            },
            {
              "title": "8.5 分",
              "value": "8.5"
            },
            {
              "title": "9 分",
              "value": "9"
            }
          ]
        }
      ]
    },
    {
      "id": "doubanCantonese",
      "title": "高分粤语电影",
      "functionName": "doubanCantonese",
      "description": "豆瓣粤语标签；排除脱口秀和真人秀。",
      "cacheDuration": 0,
      "requiresWebView": false,
      "params": [
        {
          "name": "page",
          "title": "页码",
          "type": "page"
        },
        {
          "name": "minRating",
          "title": "最低豆瓣评分",
          "type": "enumeration",
          "value": "8",
          "enumOptions": [
            {
              "title": "7 分",
              "value": "7"
            },
            {
              "title": "7.5 分",
              "value": "7.5"
            },
            {
              "title": "8 分",
              "value": "8"
            },
            {
              "title": "8.5 分",
              "value": "8.5"
            },
            {
              "title": "9 分",
              "value": "9"
            }
          ]
        }
      ]
    },
    {
      "id": "doubanForeign",
      "title": "高分外语电影",
      "functionName": "doubanForeign",
      "description": "按非中国大陆、香港、台湾、澳门出品地区近似筛选，非逐片语言核验。",
      "cacheDuration": 0,
      "requiresWebView": false,
      "params": [
        {
          "name": "page",
          "title": "页码",
          "type": "page"
        },
        {
          "name": "minRating",
          "title": "最低豆瓣评分",
          "type": "enumeration",
          "value": "8",
          "enumOptions": [
            {
              "title": "7 分",
              "value": "7"
            },
            {
              "title": "7.5 分",
              "value": "7.5"
            },
            {
              "title": "8 分",
              "value": "8"
            },
            {
              "title": "8.5 分",
              "value": "8.5"
            },
            {
              "title": "9 分",
              "value": "9"
            }
          ]
        }
      ]
    }
  ]
};
async function doubanChinese(params) { return doubanList(params, "Chinese", "电影,华语"); }
async function doubanCantonese(params) { return doubanList(params, "Cantonese", "电影,粤语"); }
async function doubanForeign(params) { return doubanList(params, "Foreign", "电影"); }
function dbRead(key) {
  try {
    var raw = Widget.storage && Widget.storage.get(key);
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch (_) { return null; }
}
function dbWrite(key, value) {
  try { if (Widget.storage) Widget.storage.set(key, JSON.stringify(value)); } catch (_) {}
}
async function dbGet(path, params) {
  var response = await Widget.http.get("https://movie.douban.com/" + path, {
    params: params,
    headers: { "User-Agent": "Mozilla/5.0", "Referer": "https://movie.douban.com/explore" }
  });
  var body = response && response.data;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (_) { throw new Error("豆瓣未返回数据，可能暂时限制访问；请稍后重试。"); }
  }
  if (!body || typeof body !== "object" || (response.status && response.status >= 400)) throw new Error("豆瓣请求失败，请检查网络或稍后重试。");
  return body;
}
async function dbDetails(rows) {
  var results = new Array(rows.length);
  var next = 0;
  async function worker() {
    while (next < rows.length) {
      var index = next++;
      var row = rows[index];
      var response = await dbGet("j/subject_abstract", {subject_id: String(row.id)});
      if (response.r !== 0 || !response.subject || String(response.subject.id) !== String(row.id)) throw new Error("豆瓣影片摘要不可用，请稍后重试。");
      results[index] = {row: row, subject: response.subject};
    }
  }
  await Promise.all([worker(), worker(), worker()]);
  return results;
}
function dbAccept(entry, category, minRating) {
  var s = entry.subject;
  var rating = Number(s.rate || entry.row.rate);
  if (s.is_tv || s.subtype !== "Movie" || !Number.isFinite(rating) || rating < minRating) return false;
  if ((s.types || []).some(function(t) { return t === "脱口秀" || t === "真人秀" || t === "舞台艺术"; })) return false;
  if (/演唱会|音乐会|纪念演出|开幕式|闭幕式|栋笃笑/.test(entry.row.title || "")) return false;
  if (category === "Foreign") {
    if (!s.region || /中国|香港|台湾|澳门|中國|臺灣|台灣|澳門/.test(s.region)) return false;
  }
  return true;
}
function dbNormalizeTitle(value) {
  return String(value || "").toLowerCase().replace(/[\s·・:：，,。.!！?？'"“”‘’()（）\-—]/g, "");
}
async function dbArtwork(entry) {
  var row = entry.row, subject = entry.subject;
  var key = "douban.tmdb.match.v1." + row.id;
  var cached = dbRead(key);
  if (cached && Date.now() - cached.time < 2592000000) return cached.movie;
  var year = String(subject.release_year || "").slice(0,4);
  var response = await Widget.tmdb.get("search/movie", {params:{query:row.title, primary_release_year:year, language:"zh-CN", include_adult:false, page:1}});
  if (!response || !Array.isArray(response.results)) throw new Error("TMDB 海报匹配失败，请检查网络后重试。");
  var title = dbNormalizeTitle(row.title);
  var matches = response.results.filter(function(m) {
    return m.poster_path && m.release_date && m.release_date.slice(0,4) === year &&
      (dbNormalizeTitle(m.title) === title || dbNormalizeTitle(m.original_title) === title);
  });
  // Ambiguous or unconfirmed matches are omitted instead of showing a wrong film.
  if (matches.length !== 1) return null;
  dbWrite(key, {time:Date.now(),movie:matches[0]});
  return matches[0];
}
async function dbVisibleItems(entries, category, minRating) {
  var out = new Array(entries.length), next = 0;
  async function worker() {
    while(next < entries.length) {
      var index = next++, entry = entries[index];
      if (!dbAccept(entry, category, minRating)) continue;
      var movie = await dbArtwork(entry);
      if (!movie) continue;
      var score = Number(entry.subject.rate || entry.row.rate);
      out[index] = {id:movie.id, type:"tmdb", mediaType:"movie", title:entry.row.title,
        posterPath:movie.poster_path, backdropPath:movie.backdrop_path || "",
        releaseDate:movie.release_date,
        // Rex labels `rating` as TMDB, so never put a Douban score in that field.
        rating:Number(movie.vote_average) || 0,
        description:"豆瓣评分：" + score.toFixed(1) + " / 10\n" + (movie.overview || "")};
    }
  }
  await Promise.all([worker(),worker(),worker()]);
  return out.filter(Boolean);
}

async function doubanList(params, category, tags) {
  params = params || {};
  var page = Number(params.page === undefined || params.page === "" ? 1 : params.page);
  var minRating = Number(params.minRating === undefined || params.minRating === "" ? 8 : params.minRating);
  if (!Number.isInteger(page) || page < 1 || page > 100 || !Number.isFinite(minRating) || minRating < 0 || minRating > 10) throw new Error("页码或最低评分无效");
  var key = "douban.moviecollections.v3." + category;
  var cached = dbRead(key);
  var state = cached && cached.minRating === minRating && Date.now() - cached.createdAt < 1800000 ? JSON.parse(JSON.stringify(cached)) : {minRating: minRating, createdAt: Date.now(), start: 0, items: [], seen: {}, done: false};
  // Preserve filtered overflow and offsets so pagination never skips accepted films.
  while (state.items.length < page * 20 && !state.done) {
    var body = await dbGet("j/new_search_subjects", {sort:"S",range:minRating+",10",tags:tags,start:state.start});
    if (!Array.isArray(body.data)) throw new Error("豆瓣列表返回异常，请稍后重试。");
    var rows = body.data;
    if (!rows.length) { state.done = true; break; }
    var newRows = rows.filter(function(row) { return row.id && !state.seen[String(row.id)]; });
    if (!newRows.length) throw new Error("豆瓣返回重复分页，已停止加载，避免无限请求。");
    var entries = await dbDetails(newRows);
    var visibleItems = await dbVisibleItems(entries, category, minRating);
    entries.forEach(function(entry) {
      state.seen[String(entry.row.id)] = true;

    });
    state.items = state.items.concat(visibleItems);
    state.start += rows.length;
    // The endpoint normally returns 20 rows. Stop only on an empty response.
    dbWrite(key, state);
  }
  dbWrite(key, state);
  var result = state.items.slice((page-1)*20,page*20);
  console.log("[豆瓣高分] " + category + " 第" + page + "页 " + result.length + "部");
  return result;
}
