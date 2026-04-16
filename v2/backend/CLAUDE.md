# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Scala 3 + Akka HTTP による HTTP API サーバー。`localhost:8080` で起動する。全エンドポイントは `/api/` プレフィックス以下に配置する。

## Development Commands

- `sbt compile` - コンパイル
- `sbt run` - サーバー起動（RETURN キーで停止）
- `sbt test` - テスト実行

## Architecture Overview

### ディレクトリ構成

```
src/main/scala/
├── Main.scala               # エントリーポイント。ルートの組み立てとサーバー起動
├── handlers/                # エンドポイントごとのハンドラー
│   ├── HealthHandler.scala
│   ├── MeHandler.scala
│   └── EntriesHandler.scala
└── middleware/              # ミドルウェア
    └── LoggingMiddleware.scala

src/test/scala/
└── handlers/
    └── EntriesHandlerSuite.scala
```

### パッケージ

すべてのファイルは `docs.http.scaladsl` パッケージ以下に配置する。

- handlers: `docs.http.scaladsl.handlers`
- middleware: `docs.http.scaladsl.middleware`

### ルートの組み立て

`Main.scala` でハンドラーの `route` を `~` で連結し、`pathPrefix("api")` でラップしてミドルウェアを適用する。

```scala
val route = LoggingMiddleware {
  pathPrefix("api") {
    HealthHandler.route ~ MeHandler.route ~ EntriesHandler.route
  }
}
```

`~` を使用するには `akka.http.scaladsl.server.Directives._` の import が必要。

## Key Implementation Patterns

### ハンドラー

`object` にルートを定義する。レスポンスは `application/json` で返す。パスには `/api/` プレフィックスを含めない（`Main.scala` の `pathPrefix` で付与される）。

```scala
object FooHandler {
  val route: Route =
    path("foo") {
      get {
        complete(HttpEntity(ContentTypes.`application/json`, """{"key":"value"}"""))
      }
    }
}
```

### ミドルウェア

`Route => Route` の形で実装する。副作用（ログ出力など）はプライベートメソッドに分離する。

```scala
object LoggingMiddleware {
  private def buildLog(request: HttpRequest): String = ...

  def apply(inner: Route): Route =
    extractRequest { request =>
      println(buildLog(request))
      inner
    }
}
```

### テスト

`akka-http-testkit` の `RouteTest with TestFrameworkInterface` は Scala 3 でコンパイルエラーになるため使用しない。代わりにポート 0 でサーバーをバインドし、`Http().singleRequest` で実リクエストを送るパターンを使用する。

```scala
class FooHandlerSuite extends FunSuite {
  implicit lazy val system: ActorSystem[Nothing] =
    ActorSystem(Behaviors.empty, "test-system")
  implicit lazy val ec: scala.concurrent.ExecutionContext = system.executionContext

  override def afterAll(): Unit = {
    system.terminate()
    super.afterAll()
  }

  test("GET /foo returns 200") {
    val result = for {
      binding  <- Http().newServerAt("localhost", 0).bind(pathPrefix("api")(FooHandler.route))
      port      = binding.localAddress.getPort
      response <- Http().singleRequest(HttpRequest(uri = s"http://localhost:$port/api/foo"))
      body     <- response.entity.toStrict(5.seconds)
      _        <- binding.unbind()
    } yield (response.status, body.data.utf8String)

    val (status, body) = Await.result(result, 10.seconds)
    assertEquals(status, StatusCodes.OK)
  }
}
```

ポート 0 を使うことでテスト並列実行時のポート衝突を防ぐ。

## Dependencies

```
Scala:             3.8.3
Akka:              2.7.0
Akka HTTP:         10.5.2
munit:             1.2.4 (test)
akka-http-testkit: 10.5.2 (test)
akka-stream-testkit: 2.7.0 (test)
```
