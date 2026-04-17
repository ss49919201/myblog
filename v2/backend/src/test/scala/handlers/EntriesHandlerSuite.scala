package docs.http.scaladsl.handlers

import akka.actor.typed.ActorSystem
import akka.actor.typed.scaladsl.Behaviors
import akka.http.scaladsl.Http
import akka.http.scaladsl.model._
import akka.http.scaladsl.server.Directives._
import docs.http.scaladsl.db.EntryRepository
import docs.http.scaladsl.models.Entry
import munit.FunSuite

import scala.concurrent.Await
import scala.concurrent.duration._

class EntriesHandlerSuite extends FunSuite {

  implicit lazy val system: ActorSystem[Nothing] =
    ActorSystem(Behaviors.empty, "test-system")
  implicit lazy val ec: scala.concurrent.ExecutionContext = system.executionContext

  override def afterAll(): Unit = {
    system.terminate()
    super.afterAll()
  }

  test("GET /entries returns 200 with empty array when no entries") {
    val repo = new EntryRepository {
      def findAll(): Seq[Entry] = Seq.empty
    }

    val result = for {
      binding  <- Http().newServerAt("localhost", 0).bind(pathPrefix("api")(EntriesHandler.route(repo)))
      port      = binding.localAddress.getPort
      response <- Http().singleRequest(HttpRequest(uri = s"http://localhost:$port/api/entries"))
      body     <- response.entity.toStrict(5.seconds)
      _        <- binding.unbind()
    } yield (response.status, response.entity.contentType, body.data.utf8String)

    val (status, contentType, body) = Await.result(result, 10.seconds)
    assertEquals(status, StatusCodes.OK)
    assertEquals(contentType, ContentTypes.`application/json`)
    assertEquals(body, "[]")
  }

  test("GET /entries returns 200 with entries JSON") {
    val now = new java.util.Date()
    val entries = Seq(
      Entry("id-1", "First Post", "Hello World", "published", now),
      Entry("id-2", "Second Post", "Content here", "draft", now)
    )
    val repo = new EntryRepository {
      def findAll(): Seq[Entry] = entries
    }

    val result = for {
      binding  <- Http().newServerAt("localhost", 0).bind(pathPrefix("api")(EntriesHandler.route(repo)))
      port      = binding.localAddress.getPort
      response <- Http().singleRequest(HttpRequest(uri = s"http://localhost:$port/api/entries"))
      body     <- response.entity.toStrict(5.seconds)
      _        <- binding.unbind()
    } yield (response.status, response.entity.contentType, body.data.utf8String)

    val (status, contentType, body) = Await.result(result, 10.seconds)
    assertEquals(status, StatusCodes.OK)
    assertEquals(contentType, ContentTypes.`application/json`)
    assert(body.contains("First Post"), s"body should contain 'First Post' but was: $body")
    assert(body.contains("Second Post"), s"body should contain 'Second Post' but was: $body")
    assert(body.contains("published"), s"body should contain 'published' but was: $body")
  }
}
