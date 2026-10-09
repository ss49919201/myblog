export type Slug = string & { readonly __brand: "Slug" };

export type Category = {
  readonly slug: Slug;
  readonly name: string;
};

export type Post = {
  readonly slug: Slug;
  readonly title: string;
  readonly publishedAt: string;
  readonly categorySlug: Slug | null;
  readonly draft: boolean;
  readonly description: string;
  readonly html: string;
};

export type Content = {
  readonly categories: readonly Category[];
  readonly posts: readonly Post[];
};

export type CategoryLink = {
  readonly slug: string;
  readonly name: string;
};

export type VisiblePost = {
  readonly slug: string;
  readonly title: string;
  readonly publishedAt: string;
  readonly description: string;
  readonly html: string;
  readonly category: CategoryLink | null;
};

export type Site = {
  readonly name: string;
  readonly description: string;
  readonly origin: string;
};

export type SqlValue = string | number | null;

export type SqlRead = {
  all(query: string, params: readonly SqlValue[]): Promise<readonly unknown[]>;
};
