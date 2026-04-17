/*
 * Copyright (C) 2020-2025 Lightbend Inc. <https://akka.io>
 */

package docs.http.scaladsl

import akka.actor.typed.ActorSystem
import akka.actor.typed.scaladsl.Behaviors
import akka.http.scaladsl.Http
import akka.http.scaladsl.server.Directives._
import docs.http.scaladsl.db.MysqlEntryRepository
import docs.http.scaladsl.handlers.EntriesHandler
import docs.http.scaladsl.handlers.HealthHandler
import docs.http.scaladsl.handlers.MeHandler
import docs.http.scaladsl.middleware.LoggingMiddleware

import scala.io.StdIn

object Main {

  def main(args: Array[String]): Unit = {

    implicit val system = ActorSystem(Behaviors.empty, "my-system")
    // needed for the future flatMap/onComplete in the end
    implicit val executionContext = system.executionContext

    val route = LoggingMiddleware {
      pathPrefix("api") {
        HealthHandler.route ~ MeHandler.route ~ EntriesHandler.route(MysqlEntryRepository)
      }
    }

    val bindingFuture = Http().newServerAt("localhost", 8080).bind(route)

    println(s"Server now online. Please navigate to http://localhost:8080/health\nPress RETURN to stop...")
    StdIn.readLine() // let it run until user presses return
    bindingFuture
      .flatMap(_.unbind()) // trigger unbinding from the port
      .onComplete(_ => system.terminate()) // and shutdown when done
  }
}
