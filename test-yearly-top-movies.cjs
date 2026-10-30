const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");
const { test } = require("node:test");

const filename = process.argv[2] || "tmdb-yearly-top-movies.js";
const source = fs.readFileSync(filename, "utf8");
function setup(responder) {
  const calls = [];
  const context = vm.createContext({
    Widget: { tmdb: { get: async (api, options) => {
      calls.push({ api, params: options.params });
      return responder(api, options.params);
    } } }
  });
  vm.runInContext(source, context);
  return { context, calls, load: context.loadYearlyTopMovies };
}
const movie = { id: 550, title: "测试电影", original_title: "Original", overview: "简介", poster_path: "/poster.jpg", backdrop_path: "/backdrop.jpg", release_date: "2025-01-02", vote_average: 8.456 };

test("年份选择覆盖六年，默认 2025，并声明分页处理函数", () => {
  const { context } = setup(() => ({ results: [] }));
  const module = context.WidgetMetadata.modules[0];
  assert.equal(typeof context[module.functionName], "function");
  assert.deepEqual(Array.from(module.params[0].enumOptions, option => option.value), ["2025", "2024", "2023", "2022", "2021", "2020"]);
  assert.equal(module.params[0].value, "2025");
  assert.equal(module.params[1].type, "page");
});

test("六个年份均由服务端筛选、评分降序、至少 500 票，保留分页", async () => {
  const { load, calls } = setup((api, params) => ({ results: [{ ...movie, id: params.primary_release_year, release_date: params.primary_release_year + "-01-02" }] }));
  for (let year = 2020; year <= 2025; year++) {
    const list = await load({ year: String(year), page: "2" });
    const sent = calls.at(-1);
    assert.equal(sent.api, "discover/movie");
    assert.deepEqual(JSON.parse(JSON.stringify(sent.params)), {
      language: "zh-CN", primary_release_year: year, sort_by: "vote_average.desc",
      "vote_count.gte": 500, include_adult: false, include_video: false, page: 2
    });
    assert.equal(list[0].id, year);
    assert.equal(list[0].releaseDate.slice(0, 4), String(year));
  }
});

test("使用 Rex 标准电影字段及内置详情，保持服务端顺序和评分精度", async () => {
  const { load, calls } = setup(() => ({ results: [movie, { ...movie, id: 551, vote_average: 8.455 }] }));
  const list = await load();
  assert.equal(calls[0].params.page, 1);
  assert.equal(calls[0].params.primary_release_year, 2025);
  assert.deepEqual(JSON.parse(JSON.stringify(list[0])), {
    id: 550, type: "tmdb", mediaType: "movie", title: "测试电影", description: "简介",
    posterPath: "/poster.jpg", backdropPath: "/backdrop.jpg", releaseDate: "2025-01-02", rating: 8.456
  });
  assert.equal(list[1].id, 551);
  assert.equal(list[0].poster_path, undefined);
  assert.equal(list[0].link, undefined);
});

test("无中文标题/海报时可返回，空页正常结束", async () => {
  const { load } = setup(() => ({ results: [{ id: 1, original_title: "Original", vote_average: 8 }] }));
  const item = (await load())[0];
  assert.equal(item.title, "Original");
  assert.equal(item.posterPath, "");
  assert.equal((await setup(() => ({ results: [] })).load()).length, 0);
});

test("非法年份与页码不发请求，超出 API 页数上限正常结束", async () => {
  const { load, calls } = setup(() => ({ results: [] }));
  for (const year of [2019, 2026, "2025oops", 2020.5]) await assert.rejects(load({ year }), /年份/);
  for (const page of [0, -1, 1.5, "abc"]) await assert.rejects(load({ page }), /页码/);
  assert.equal((await load({ page: 501 })).length, 0);
  assert.equal(calls.length, 0);
});

test("API 错误不伪装成空榜单，网络错误传回 Rex", async () => {
  for (const response of [null, {}, { results: {} }, { success: false, results: [] }, { data: { results: [] } }]) {
    await assert.rejects(setup(() => response).load(), /TMDB/);
  }
  await assert.rejects(setup(() => { throw new Error("network offline"); }).load(), /network offline/);
});
