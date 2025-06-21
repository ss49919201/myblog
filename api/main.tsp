import "@typespec/http";

using Http;
@service(#{ title: "MyBlog" })
namespace DemoService;

enum PublicationStatus {
  draft: "draft",
  scheduled: "scheduled",
  published: "published",
}

enum UserRole {
  general: "general",
  editor: "editor",
  admin: "admin",
}

model Post {
  id: string;
  title: string;
  body: string;
  status: PublicationStatus;
  scheduledAt: utcDateTime | null;
  category: string;
  tags: string[];
  featuredImageURL: string | null;
  metaDescription: string | null;
  slug: string | null;
  snsAutoPost: boolean;
  externalNotification: boolean;
  emergencyFlag: boolean;
  createdAt: utcDateTime;
  publishedAt: utcDateTime | null;
}

model CreatePostRequest {
  title: string;
  body: string;
  status: PublicationStatus;
  scheduledAt: utcDateTime | null;
  category: string;
  tags: string[];
  featuredImageURL: string | null;
  metaDescription: string | null;
  slug: string | null;
  snsAutoPost: boolean;
  externalNotification: boolean;
  emergencyFlag: boolean;
}

model UserContext {
  role: UserRole;
}

model PostList {
  items: Post[];
}

@error
model Error {
  code: int32;
  message: string;
}

@error
model ValidationError {
  code: int32;
  message: string;
  field: string;
}

@error
model ValidationErrors {
  code: int32;
  message: string;
  errors: ValidationError[];
}

model AnalyzeResult {
  id: string;
  analysis: string;
}

@route("/api")
@tag("API")
namespace API {
  @route("/posts")
  @tag("Post")
  interface Posts {
    /** List Posts */
    @get list(): PostList | Error;
    /** Read Posts */
    @get read(@path id: string): Post | Error;
    /** Create a Post */
    @post create(
      @body body: CreatePostRequest,

      /** FIXME: use database */
      @header("X-User-Role") userRole: UserRole,
    ): Post | ValidationErrors | Error;
    /** Update a Post */
    @patch update(
      @path id: string,
      @body body: MergePatchUpdate<Post>,
    ): Post | Error;
    /** Delete a Post */
    @delete delete(@path id: string): void | Error;

    /** Analyze a Post */
    @route("{id}/analyze") @post analyze(
      @path id: string,
    ): AnalyzeResult | Error;
  }
}
