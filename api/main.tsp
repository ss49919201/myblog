import "@typespec/http";

using Http;
@service(#{ title: "MyBlog" })
namespace DemoService;

model Post {
  id: string;
  title: string;
  body: string;
  publishdAt: utcDateTime | null;
}

model PostList {
  items: Post[];
}

@error
model Error {
  code: int32;
  message: string;
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
    @post create(@body body: Post): Post | Error;
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
