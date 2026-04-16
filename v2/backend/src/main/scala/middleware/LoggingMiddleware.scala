package docs.http.scaladsl.middleware

import akka.http.scaladsl.model.HttpRequest
import akka.http.scaladsl.server.Directives.*
import akka.http.scaladsl.server.Route

import java.time.Instant

object LoggingMiddleware {
  private def buildLog(request: HttpRequest): String =
    s"""{"time":"${Instant.now()}","url":"${request.uri}"}"""

  def apply(inner: Route): Route =
    extractRequest { request =>
      println(buildLog(request))
      inner
    }
}
