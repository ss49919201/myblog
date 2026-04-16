package docs.http.scaladsl.handlers

import akka.http.scaladsl.model._
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route

object HealthHandler {

  val route: Route =
    path("health") {
      get {
        complete(HttpEntity(ContentTypes.`application/json`, """{"status":"ok"}"""))
      }
    }
}
