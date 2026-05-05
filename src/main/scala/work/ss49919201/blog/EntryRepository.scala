package work.ss49919201.blog

import org.commonmark.parser.Parser
import org.commonmark.renderer.html.HtmlRenderer
import org.yaml.snakeyaml.Yaml

import java.io.File
import java.time.LocalDate
import scala.io.Source
import scala.jdk.CollectionConverters.*
import scala.util.Using

class EntryRepository(entriesDir: File):

  private val mdParser = Parser.builder().build()
  private val renderer = HtmlRenderer.builder().build()
  private val yaml = new Yaml()

  def findAll(): List[Entry] =
    entriesDir
      .listFiles()
      .toList
      .filter(_.getName.endsWith(".md"))
      .flatMap(f => parse(f))
      .sortBy(_.date)(Ordering[LocalDate].reverse)

  def findById(id: String): Option[Entry] =
    val file = new File(entriesDir, s"$id.md")
    if file.exists() then parse(file) else None

  private def parse(file: File): Option[Entry] =
    Using(Source.fromFile(file, "UTF-8")) { source =>
      val content = source.mkString
      val id = file.getName.stripSuffix(".md")

      if content.startsWith("---") then
        val end = content.indexOf("---", 3)
        if end == -1 then None
        else
          val frontMatter = content.substring(3, end).trim
          val body = content.substring(end + 3).trim

          val meta = yaml.load[java.util.Map[String, Any]](frontMatter).asScala
          val title = meta.get("title").map(_.toString).filter(_.nonEmpty).getOrElse("_")
          val fallbackDate = LocalDate.of(1970, 1, 1)
          val date = meta.get("date").map {
            case d: java.util.Date =>
              d.toInstant.atZone(java.time.ZoneId.systemDefault()).toLocalDate
            case s =>
              scala.util.Try(LocalDate.parse(s.toString)).getOrElse(fallbackDate)
          }.getOrElse(LocalDate.now())

          val bodyHtml = renderer.render(mdParser.parse(body))
          Some(Entry(id, title, date, bodyHtml))
      else
        val bodyHtml = renderer.render(mdParser.parse(content))
        Some(Entry(id, "_", LocalDate.now(), bodyHtml))
    }.toOption.flatten
