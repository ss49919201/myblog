package work.ss49919201.blog

import java.time.LocalDate

case class Entry(
  id: String,
  title: String,
  date: LocalDate,
  bodyHtml: String
)
