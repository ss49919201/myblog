import { Resvg } from "@resvg/resvg-js";
import satori from "satori";

import { postOgCardElement, siteOgCardElement } from "./card";
import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from "./constants";
import { ogFonts } from "./fonts";

async function renderOgPng(element: ReturnType<typeof postOgCardElement> | ReturnType<typeof siteOgCardElement>): Promise<Buffer> {
  const fonts = await ogFonts();
  const svg = await satori(element, {
    width: OG_IMAGE_WIDTH,
    height: OG_IMAGE_HEIGHT,
    fonts,
    embedFont: true,
  });
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: OG_IMAGE_WIDTH },
    background: "#f8fafc",
  });
  return resvg.render().asPng();
}

export async function renderPostOgPng(input: { title: string }): Promise<Buffer> {
  const title = input.title.trim();
  if (!title) {
    throw new Error("Post OG image requires a non-empty title");
  }
  return renderOgPng(postOgCardElement({ title }));
}

export async function renderSiteOgPng(): Promise<Buffer> {
  return renderOgPng(siteOgCardElement());
}
