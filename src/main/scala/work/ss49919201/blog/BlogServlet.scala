package work.ss49919201.blog

import org.scalatra._

import java.io.File

class BlogServlet extends ScalatraServlet:

  private val repository = EntryRepository(File("data/entries"))

  get("/") {
    val entries = repository.findAll()
    views.html.index(entries)
  }

  get("/entries/:id") {
    repository.findById(params("id")) match
      case Some(entry) => views.html.entry(entry)
      case None        => halt(404, "Not Found")
  }
