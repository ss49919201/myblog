import { vValidator } from "@hono/valibot-validator";
import { Hono } from "hono";
import type { Context } from "hono";
import { csrf } from "hono/csrf";
import { jsxRenderer } from "hono/jsx-renderer";
import * as v from "valibot";
import { submitPost } from "../../application/submit-post";
import { submitPostInputSchema } from "../../domain/validate-submit-input";
import type { Env } from "../../env";
import { ComposePage } from "../../views/ComposePage";
import { markdownItRenderer } from "../markdown/markdown-it-renderer";
import { createD1PostRepository } from "../persistence/d1-post-repository";
import { registerSettingsBasicRoutes } from "./settings-basic";

const app = new Hono<{ Bindings: Env }>();

app.use("*", jsxRenderer());

function publicPostUrl(env: Env, slug: string): string {
  const base = env.PUBLIC_WEB_URL.replace(/\/$/, "");
  return `${base}/posts/${slug}`;
}

function renderForm(
  c: { render: Context["render"] },
  props: {
    title?: string;
    bodyMd?: string;
    errorMessage?: string;
    publishedUrl?: string;
  },
) {
  const page = (
    <ComposePage
      title={props.title}
      bodyMd={props.bodyMd}
      errorMessage={props.errorMessage}
      publishedUrl={props.publishedUrl}
    />
  );
  return c.render(page);
}

app.get("/", (c) => renderForm(c, {}));

app.post(
  "/",
  csrf(),
  vValidator(
    "form",
    v.object({
      title: v.pipe(v.string(), v.minLength(1, "タイトルと本文は必須です。")),
      body_md: v.pipe(v.string(), v.minLength(1, "タイトルと本文は必須です。")),
    }),
    (result, c) => {
      if (!result.success) {
        return renderForm(c, {
          title: result.typed ? result.output.title : "",
          bodyMd: result.typed ? result.output.body_md : "",
          errorMessage: result.issues[0].message,
        });
      }
    },
  ),
  async (c) => {
    const { title, body_md: bodyMd } = c.req.valid("form");
    const input = v.parse(submitPostInputSchema, {
      title,
      bodyMd,
      publishedAt: new Date(),
    });
    const result = await submitPost(
      {
        posts: createD1PostRepository(c.env.DB),
        markdown: markdownItRenderer,
      },
      input,
    );

    return result.match(
      (post) =>
        renderForm(c, {
          publishedUrl: publicPostUrl(c.env, post.slug),
        }),
      () =>
        renderForm(c, {
          title,
          bodyMd,
          errorMessage:
            "保存に失敗しました。しばらくしてから再度お試しください。",
        }),
    );
  },
);

registerSettingsBasicRoutes(app);

export default app;
