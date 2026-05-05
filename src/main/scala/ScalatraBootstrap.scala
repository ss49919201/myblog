import work.ss49919201.blog._
import org.scalatra._
import jakarta.servlet.ServletContext

class ScalatraBootstrap extends LifeCycle {
  override def init(context: ServletContext): Unit = {
    context.mount(new BlogServlet, "/*")
  }
}
