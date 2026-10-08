import { siteName } from "../site";
import { OG_FONT_FAMILY, OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from "./constants";

type SatoriElement = {
  type: string;
  props: {
    style?: Record<string, string | number>;
    children?: string | SatoriElement | Array<string | SatoriElement>;
  };
};

type PostCardProps = { title: string };

export function postOgCardElement(props: PostCardProps): SatoriElement {
  return {
    type: "div",
    props: {
      style: {
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#f8fafc",
        padding: 64,
        fontFamily: OG_FONT_FAMILY,
        color: "#0f172a",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              fontSize: 56,
              fontWeight: 700,
              lineHeight: 1.25,
              maxWidth: OG_IMAGE_WIDTH - 128,
            },
            children: props.title,
          },
        },
        {
          type: "div",
          props: {
            style: { fontSize: 28, fontWeight: 700, color: "#475569" },
            children: siteName,
          },
        },
      ],
    },
  };
}

export function siteOgCardElement(): SatoriElement {
  return {
    type: "div",
    props: {
      style: {
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f8fafc",
        fontFamily: OG_FONT_FAMILY,
        fontSize: 72,
        fontWeight: 700,
        color: "#0f172a",
      },
      children: siteName,
    },
  };
}
