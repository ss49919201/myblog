package docs.http.scaladsl.handlers

import akka.http.scaladsl.model._
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route

object EntriesHandler {

  val route: Route =
    path("entries") {
      get {
        complete(HttpEntity(ContentTypes.`application/json`, "[]"))
      }
    }
}
