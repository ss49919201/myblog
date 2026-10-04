"use client";

import { useActionState } from "react";
import type { PostInput, PostStatus } from "@/lib/posts";
import type { PostFormState } from "./actions";

type Props = {
  action: (state: PostFormState, formData: FormData) => Promise<PostFormState>;
  initialValues?: PostInput;
  submitLabel: string;
};

const EMPTY: PostInput = { slug: "", title: "", body: "", status: "draft" };

const STATUS_OPTIONS: { value: PostStatus; label: string }[] = [
  { value: "draft", label: "下書き" },
  { value: "published", label: "公開" },
];

const inputClass =
  "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 focus:border-slate-500 focus:outline-none";

export function PostForm({ action, initialValues = EMPTY, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const values = state.values ?? initialValues;

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {state.error && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <label className="block text-sm font-medium">
        タイトル
        <input name="title" required maxLength={200} defaultValue={values.title} className={inputClass} />
      </label>

      <label className="block text-sm font-medium">
        スラッグ（URL: /posts/スラッグ）
        <input
          name="slug"
          required
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          defaultValue={values.slug}
          className={`${inputClass} font-mono`}
        />
      </label>

      <label className="block text-sm font-medium">
        本文（Markdown）
        <textarea
          name="body"
          required
          rows={20}
          defaultValue={values.body}
          className={`${inputClass} font-mono text-sm`}
        />
      </label>

      <fieldset>
        <legend className="text-sm font-medium">ステータス</legend>
        <div className="mt-2 flex gap-6 text-sm">
          {STATUS_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-2">
              <input
                type="radio"
                name="status"
                value={option.value}
                defaultChecked={values.status === option.value}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {pending ? "保存中..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
