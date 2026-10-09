import { siteName } from "../site";
import {
  OG_BORDER_COLOR,
  OG_BORDER_WIDTH,
  OG_FONT_FAMILY,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  OG_INNER_BACKGROUND,
} from "./constants";

type SatoriElement = {
  type: string;
  props: {
    style?: Record<string, string | number>;
    children?: string | SatoriElement | Array<string | SatoriElement>;
  };
};

const INNER_PADDING_X = 56;
const INNER_PADDING_TOP = 48;
const INNER_PADDING_BOTTOM = 40;
const TITLE_FONT_SIZE = 52;
const SITE_NAME_FONT_SIZE = 28;
const FOOTER_GAP = 28;

function framedCard(content: SatoriElement | Array<SatoriElement>): SatoriElement {
  return {
    type: "div",
    props: {
      style: {
        width: OG_IMAGE_WIDTH,
        height: OG_IMAGE_HEIGHT,
        display: "flex",
        backgroundColor: OG_BORDER_COLOR,
        padding: OG_BORDER_WIDTH,
        boxSizing: "border-box",
      },
      children: {
        type: "div",
        props: {
          style: {
            display: "flex",
            flex: 1,
            width: "100%",
            height: "100%",
            backgroundColor: OG_INNER_BACKGROUND,
            fontFamily: OG_FONT_FAMILY,
            color: "#0f172a",
            boxSizing: "border-box",
          },
          children: content,
        },
      },
    },
  };
}

type PostCardProps = { title: string };

export function postOgCardElement(props: PostCardProps): SatoriElement {
  const innerWidth = OG_IMAGE_WIDTH - OG_BORDER_WIDTH * 2 - INNER_PADDING_X * 2;

  return framedCard({
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        paddingLeft: INNER_PADDING_X,
        paddingRight: INNER_PADDING_X,
        paddingTop: INNER_PADDING_TOP,
        paddingBottom: INNER_PADDING_BOTTOM,
        boxSizing: "border-box",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flex: 1,
              flexDirection: "column",
              justifyContent: "center",
              minHeight: 0,
              paddingBottom: FOOTER_GAP,
            },
            children: {
              type: "div",
              props: {
                style: {
                  fontSize: TITLE_FONT_SIZE,
                  fontWeight: 700,
                  lineHeight: 1.3,
                  maxWidth: innerWidth,
                },
                children: props.title,
              },
            },
          },
        },
        {
          type: "div",
          props: {
            style: {
              flexShrink: 0,
              fontSize: SITE_NAME_FONT_SIZE,
              fontWeight: 700,
              color: "#475569",
            },
            children: siteName,
          },
        },
      ],
    },
  });
}

export function siteOgCardElement(): SatoriElement {
  return framedCard({
    type: "div",
    props: {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
      },
      children: {
        type: "div",
        props: {
          style: {
            fontSize: 72,
            fontWeight: 700,
            textAlign: "center",
            paddingLeft: INNER_PADDING_X,
            paddingRight: INNER_PADDING_X,
          },
          children: siteName,
        },
      },
    },
  });
}
