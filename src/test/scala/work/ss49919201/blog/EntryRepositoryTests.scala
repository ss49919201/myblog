package work.ss49919201.blog

import org.scalatest.matchers.should.Matchers
import org.scalatest.wordspec.AnyWordSpec

import java.io.File
import java.time.LocalDate

class EntryRepositoryTests extends AnyWordSpec with Matchers {

  private val testEntriesDir = File(getClass.getResource("/entries").toURI)
  private val repository = EntryRepository(testEntriesDir)

  "EntryRepository" should {

    "get all entries" in {
      val entries = repository.findAll()
      entries should have size 3
      entries.map(_.id) should contain allOf ("entry-1", "entry-2", "entry-invalid-date")
    }

    "get only markdown files" in {
      val entries = repository.findAll()
      entries.map(_.id) should not contain "not-markdown"
    }

    "get entry by id" in {
      val entry = repository.findById("entry-1")
      entry shouldBe defined
      entry.get.title shouldBe "Test Entry 1"
    }

    "fallback to 1970-01-01 when date is invalid" in {
      val entry = repository.findById("entry-invalid-date")
      entry shouldBe defined
      entry.get.date shouldBe LocalDate.of(1970, 1, 1)
    }

  }

}
