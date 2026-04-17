---
name: akka-handler-repository
description: Scala 3 + Akka HTTP バックエンドで新しいエンドポイントを実装するときのスキル。handler → repository パターンで model / db / handlers の各ファイルを作成し、Main.scala への配線とテストまで一貫して実装する。「〇〇エンドポイントを追加」「〇〇ハンドラーを実装」「MySQLから〇〇を取得するAPIを作る」などのリクエストで使用する。
---

# Akka HTTP Handler + Repository 実装

## プロジェクト構成

```
src/main/scala/
├── Main.scala                   # ルート組み立て・サーバー起動
├── models/                      # ドメインモデル + JSON protocol
├── db/                          # リポジトリ trait + MySQL 実装
├── handlers/                    # エンドポイントハンドラー
└── middleware/

src/test/scala/handlers/         # ハンドラーテスト
```

パッケージルート: `docs.http.scaladsl`

## 実装ステップ（TDD: テストから書く）

### 1. テストを先に書く

`src/test/scala/handlers/FooHandlerSuite.scala`

```scala
package docs.http.scaladsl.handlers

import akka.actor.typed.ActorSystem
import akka.actor.typed.scaladsl.Behaviors
import akka.http.scaladsl.Http
import akka.http.scaladsl.model._
import akka.http.scaladsl.server.Directives._
import docs.http.scaladsl.db.FooRepository
import docs.http.scaladsl.models.Foo
import munit.FunSuite
import scala.concurrent.Await
import scala.concurrent.duration._

class FooHandlerSuite extends FunSuite {
  implicit lazy val system: ActorSystem[Nothing] =
    ActorSystem(Behaviors.empty, "test-system")
  implicit lazy val ec = system.executionContext

  override def afterAll(): Unit = { system.terminate(); super.afterAll() }

  test("GET /foos returns 200 with empty array") {
    val repo = new FooRepository { def findAll() = Seq.empty }
    val result = for {
      binding  <- Http().newServerAt("localhost", 0).bind(pathPrefix("api")(FooHandler.route(repo)))
      port      = binding.localAddress.getPort
      response <- Http().singleRequest(HttpRequest(uri = s"http://localhost:$port/api/foos"))
      body     <- response.entity.toStrict(5.seconds)
      _        <- binding.unbind()
    } yield (response.status, response.entity.contentType, body.data.utf8String)

    val (status, ct, body) = Await.result(result, 10.seconds)
    assertEquals(status, StatusCodes.OK)
    assertEquals(ct, ContentTypes.`application/json`)
    assertEquals(body, "[]")
  }

  test("GET /foos returns 200 with data") {
    val foos = Seq(Foo("id-1", "Name A"), Foo("id-2", "Name B"))
    val repo = new FooRepository { def findAll() = foos }
    // ... binding/request と同様
    assert(body.contains("Name A"))
  }
}
```

**ポイント:**
- ポート 0 でバインド → テスト並列実行でもポート衝突なし
- `FooRepository` をモック実装してハンドラー単体をテスト
- `akka-http-testkit` の `RouteTest` は Scala 3 でコンパイルエラーになるため使用しない

### 2. モデルを作成

`src/main/scala/models/Foo.scala`

```scala
package docs.http.scaladsl.models

import spray.json.DefaultJsonProtocol
import spray.json.DeserializationException
import spray.json.JsString
import spray.json.JsValue
import spray.json.JsonFormat
import spray.json.RootJsonFormat

import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Date

case class Foo(id: String, name: String, createdAt: Date)

object FooJsonProtocol extends DefaultJsonProtocol {
  private val formatter = DateTimeFormatter.ISO_OFFSET_DATE_TIME.withZone(ZoneId.of("UTC"))

  implicit val dateFormat: JsonFormat[Date] = new JsonFormat[Date] {
    def write(d: Date): JsValue = JsString(formatter.format(d.toInstant))
    def read(v: JsValue): Date = v match {
      case JsString(s) => Date.from(java.time.Instant.parse(s))
      case _           => throw DeserializationException("Expected ISO date string")
    }
  }

  implicit val fooFormat: RootJsonFormat[Foo] = jsonFormat3(Foo.apply)
}
```

- フィールド数に合わせて `jsonFormat2` / `jsonFormat3` ... と変える
- camelCase フィールド名がそのまま JSON キーになる
- 日時フィールドは `java.util.Date` を使い、ISO 8601 形式（UTC）でシリアライズ
- `dateFormat` を `fooFormat` より先に定義すること（implicit の解決順序）

### 3. リポジトリを作成

`src/main/scala/db/FooRepository.scala`

```scala
package docs.http.scaladsl.db

import docs.http.scaladsl.models.Foo
import java.sql.DriverManager

trait FooRepository {
  def findAll(): Seq[Foo]
}

object MysqlFooRepository extends FooRepository {
  private val url      = "jdbc:mysql://localhost:3306/rdb"
  private val user     = "user"
  private val password = "password"

  def findAll(): Seq[Foo] = {
    val conn = DriverManager.getConnection(url, user, password)
    try {
      val rs  = conn.createStatement().executeQuery("SELECT ... FROM foos ORDER BY created_at DESC")
      val buf = scala.collection.mutable.ArrayBuffer.empty[Foo]
      while (rs.next()) buf += Foo(rs.getString("id"), rs.getString("name"))
      buf.toSeq
    } finally conn.close()
  }
}
```

- UUID カラムは `BIN_TO_UUID(id) AS id` でSELECT
- TIMESTAMP カラムは `rs.getTimestamp("created_at")` をそのまま渡す（`java.sql.Timestamp` は `java.util.Date` のサブクラス）

### 4. ハンドラーを作成

`src/main/scala/handlers/FooHandler.scala`

```scala
package docs.http.scaladsl.handlers

import akka.http.scaladsl.model.ContentTypes
import akka.http.scaladsl.model.HttpEntity
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import docs.http.scaladsl.db.FooRepository
import docs.http.scaladsl.models.FooJsonProtocol._
import spray.json.JsArray

object FooHandler {
  def route(repo: FooRepository): Route =
    path("foos") {
      get {
        val json = JsArray(repo.findAll().map(fooFormat.write).toVector)
        complete(HttpEntity(ContentTypes.`application/json`, json.compactPrint))
      }
    }
}
```

- `complete(repo.findAll())` は Scala 3 で型曖昧エラーになるため、`JsArray` で明示的にシリアライズする
- パスに `/api/` プレフィックスは含めない（Main.scala の `pathPrefix` で付与される）

### 5. Main.scala に配線

```scala
import docs.http.scaladsl.db.MysqlFooRepository
import docs.http.scaladsl.handlers.FooHandler

// route 組み立て部分
HealthHandler.route ~ MeHandler.route ~ EntriesHandler.route(MysqlEntryRepository) ~ FooHandler.route(MysqlFooRepository)
```

## データベース

- MySQL: `localhost:3306` / DB: `rdb` / user: `user` / password: `password`
- Docker 起動: `docker compose -f /Users/sakaeshinya/src/myblog/compose.yaml up -d mysql`
- スキーマ: `/Users/sakaeshinya/src/myblog/database/schema.sql`

## 依存関係（build.sbt）

必要な依存が未追加の場合は追記:

```scala
"com.typesafe.akka" %% "akka-http-spray-json" % AkkaHttpVersion,
"com.mysql"          % "mysql-connector-j"     % "8.3.0"
```

## テスト実行

```bash
sbt test          # ユニットテスト（モックリポジトリ）
sbt compile       # コンパイル確認
```

## チェックリスト

- [ ] テストを先に書き、コンパイルエラーを確認
- [ ] `models/Foo.scala` — case class + JsonProtocol
- [ ] `db/FooRepository.scala` — trait + MySQL実装
- [ ] `handlers/FooHandler.scala` — `route(repo)` メソッド
- [ ] `Main.scala` — ルートに追加
- [ ] `sbt test` がグリーン
