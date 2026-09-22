import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,

  /**
   * Локализованных роутов в приложении нет — все страницы лежат в корне.
   * Но соседние проекты используют префикс локали, и адреса вида /ru/... или
   * /en/... попадают сюда из привычки и истории браузера. Вместо 404
   * срезаем префикс и отдаём ту же страницу.
   */
  async redirects() {
    return [
      {
        source: "/:locale(ru|en|kz)",
        destination: "/",
        permanent: false,
      },
      {
        source: "/:locale(ru|en|kz)/:path*",
        destination: "/:path*",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
