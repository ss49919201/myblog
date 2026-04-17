package docs.http.scaladsl.handlers

import akka.http.scaladsl.model.ContentTypes
import akka.http.scaladsl.model.HttpEntity
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import docs.http.scaladsl.db.EntryRepository
import docs.http.scaladsl.models.EntryJsonProtocol._
import spray.json.JsArray

object EntriesHandler {

  def route(repo: EntryRepository): Route =
    path("entries") {
      get {
        val json = JsArray(repo.findAll().map(entryFormat.write).toVector)
        complete(HttpEntity(ContentTypes.`application/json`, json.compactPrint))
      }
    }
}
