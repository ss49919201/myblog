# CLAUDE.md

This file provides guidance to Claude Code when working with code in this directory.

## Project Overview

Scala 3 + Akka HTTP による HTTP API サーバー。`localhost:8080` で起動する。

## Development Commands

- `sbt compile` - コンパイル
- `sbt run` - サーバー起動（RETURN キーで停止）

## Architecture Overview

### ディレクトリ構成

```
src/main/scala/
├── Main.scala               # エントリーポイント。ルートの組み立てとサーバー起動
├── handlers/                # エンドポイントごとのハンドラー
│   ├── HealthHandler.scala
│   └── MeHandler.scala
└── middleware/              # ミドルウェア
    └── LoggingMiddleware.scala
```

### パッケージ

すべてのファイルは `docs.http.scaladsl` パッケージ以下に配置する。

- handlers: `docs.http.scaladsl.handlers`
- middleware: `docs.http.scaladsl.middleware`

### ルートの組み立て

`Main.scala` でハンドラーの `route` を `~` で連結し、ミドルウェアでラップする。

```scala
val route = LoggingMiddleware(HealthHandler.route ~ MeHandler.route)
```

`~` を使用するには `akka.http.scaladsl.server.Directives._` の import が必要。

## Key Implementation Patterns

### ハンドラー

`object` にルートを定義する。レスポンスは `application/json` で返す。

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

## Endpoints

| Method | Path      | Description          |
|--------|-----------|----------------------|
| GET    | /health   | ヘルスチェック。`{"status":"ok"}` を返す |
| GET    | /me       | 現在のユーザー情報。現在は `{}` を返す |

## Dependencies

```
Scala:    3.8.3
Akka:     2.7.0
Akka HTTP: 10.5.2
munit:    1.2.4 (test)
```
