import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import type { Font } from "satori";

import { OG_FONT_FAMILY } from "./constants";

let cached: Font[] | undefined;

export async function ogFonts(): Promise<Font[]> {
  if (cached) return cached;
  const require = createRequire(import.meta.url);
  const fontPath = require.resolve(
    "@fontsource/noto-sans-jp/files/noto-sans-jp-japanese-700-normal.woff",
  );
  const data = await readFile(fontPath);
  cached = [
    {
      name: OG_FONT_FAMILY,
      data,
      weight: 700,
      style: "normal",
      lang: "ja-JP",
    },
  ];
  return cached;
}
