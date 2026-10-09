const z = {
  string() {
    const schema = {
      min(_length: number) {
        return schema;
      },
    };
    return schema;
  },
  coerce: {
    date() {
      return {};
    },
  },
  boolean() {
    return {
      default(_value: boolean) {
        return {};
      },
    };
  },
  object(_shape: object) {
    return {};
  },
};

function reference(_collection: string) {
  return {
    optional() {
      return {};
    },
  };
}

const categories = z.object({
  name: z.string(),
});

const posts = z.object({
  title: z.string(),
  slug: z.string().min(1),
  date: z.coerce.date(),
  category: reference("categories").optional(),
  draft: z.boolean().default(false),
});

export { categories, posts };
