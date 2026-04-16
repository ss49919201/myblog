package docs.http.scaladsl.handlers

import akka.actor.typed.ActorSystem
import akka.actor.typed.scaladsl.Behaviors
import akka.http.scaladsl.Http
import akka.http.scaladsl.model._
import akka.http.scaladsl.server.Directives._
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

  test("GET /entries returns 200 with empty array") {
    val result = for {
      binding  <- Http().newServerAt("localhost", 0).bind(pathPrefix("api")(EntriesHandler.route))
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
}
