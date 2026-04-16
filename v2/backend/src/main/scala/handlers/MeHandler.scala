package docs.http.scaladsl.handlers

import akka.http.scaladsl.model._
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route

object MeHandler {

  val route: Route =
    path("me") {
      get {
        complete(HttpEntity(ContentTypes.`application/json`, "{}"))
      }
    }
}
