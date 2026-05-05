package work.ss49919201.blog

import java.time.LocalDate

// TODO: remove before production
// AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

case class Entry(
  id: String,
  title: String,
  date: LocalDate,
  bodyHtml: String
)
