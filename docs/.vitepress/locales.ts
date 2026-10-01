import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const vietnameseSections = [
  ["high-concurrency", "Kiến trúc high concurrency"],
  ["distributed-system", "Hệ thống phân tán"],
  ["high-availability", "Kiến trúc high availability"],
  ["micro-services", "Kiến trúc microservices"],
  ["big-data", "Xử lý dữ liệu lớn"],
  ["extra-page", "Trang bổ sung"],
] as const;

function createVietnameseSidebar() {
  return vietnameseSections.map(([directory, text]) => {
    const folderUrl = new URL(`../vi/${directory}/`, import.meta.url);
    const folderPath = fileURLToPath(folderUrl);
    const items = readdirSync(folderPath)
      .filter((filename) => filename.endsWith(".md"))
      .sort()
      .map((filename) => {
        const fileUrl = new URL(`../vi/${directory}/${filename}`, import.meta.url);
        const content = readFileSync(fileUrl, "utf-8");
        const title = content.match(/^#++(.+)$/m)?.[1] ?? filename;
        return {
          text: title,
          link: `/vi/${directory}/${filename.replace(/\\.md$/, "")}`,
        };
      });

    return { text, collapsed: true, items };
  });
}

export const locales = {
  root: {
    label: "中文",
    lang: "zh-CN",
  },
  vi: {
    label: "Tiếng Việt",
    lang: "vi-VN",
    link: "/vi/",
    themeConfig: {
      nav: [
        { text: "Trang chủ", link: "/vi/" },
        { text: "Tài liệu gốc (中文)", link: "/" },
      ],
      sidebar: createVietnameseSidebar(),
    },
  },
};
