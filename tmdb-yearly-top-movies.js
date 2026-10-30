WidgetMetadata = {
  id: "rex.julian.tmdb.yearlyTopMovies",
  title: "年度高分电影 · 2020—2025",
  version: "1.0.1",
  requiredVersion: "0.0.1",
  description: "每年 Top 50，TMDB 评分从高到低，至少 500 人评分。",
  author: "Julian",
  site: "https://www.themoviedb.org",
  modules: [
    {
      id: "yearlyTopMovies",
      title: "年度高分电影",
      description: "选择 2020—2025 年，每年仅展示评分最高的 50 部电影（至少 500 人评分）。",
      functionName: "loadYearlyTopMovies",
      cacheDuration: 3600,
      requiresWebView: false,
      sectionMode: false,
      params: [
        {
          name: "year",
          title: "上映年份",
          type: "enumeration",
          value: "2025",
          enumOptions: [
            { title: "2025 年", value: "2025" },
            { title: "2024 年", value: "2024" },
            { title: "2023 年", value: "2023" },
            { title: "2022 年", value: "2022" },
            { title: "2021 年", value: "2021" },
            { title: "2020 年", value: "2020" }
          ]
        },
        { name: "page", title: "页码", type: "page", value: "1" }
      ]
    }
  ]
};

async function loadYearlyTopMovies(params = {}) {
  const year = Number(params.year == null || params.year === "" ? 2025 : params.year);
  const page = Number(params.page == null || params.page === "" ? 1 : params.page);
  if (!Number.isInteger(year) || year < 2020 || year > 2025) {
    throw new Error("请选择 2020—2025 年之间的上映年份。");
  }
  if (!Number.isInteger(page) || page < 1) {
    throw new Error("页码必须是大于 0 的整数。");
  }
  // TMDB 每页 20 条：前两页各 20 条，第三页仅取 10 条，之后结束。
  const pageSize = 20;
  const remaining = 50 - (page - 1) * pageSize;
  if (remaining <= 0) return [];

  const response = await Widget.tmdb.get("discover/movie", {
    params: {
      language: "zh-CN",
      primary_release_year: year,
      sort_by: "vote_average.desc",
      "vote_count.gte": 500,
      include_adult: false,
      include_video: false,
      page: page
    }
  });

  // tmdb.get 直接返回响应主体，区别于 http.get 的 response.data。
  if (!response || response.success === false || !Array.isArray(response.results)) {
    throw new Error("TMDB 电影榜单加载失败，请检查 Rex 的 TMDB 连接后重试。");
  }

  // 排序与年份过滤在服务端完成，保持跨页排序一致。
  return response.results.slice(0, Math.min(pageSize, remaining)).map(function (movie) {
    return {
      id: movie.id,
      type: "tmdb",
      mediaType: "movie",
      title: movie.title || movie.original_title || "未命名电影",
      description: movie.overview || "",
      posterPath: movie.poster_path || "",
      backdropPath: movie.backdrop_path || "",
      releaseDate: movie.release_date || "",
      rating: movie.vote_average
    };
  });
}
