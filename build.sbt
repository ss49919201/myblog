val ScalatraVersion = "3.1.2"

ThisBuild / scalaVersion := "3.3.7"
ThisBuild / organization := "work.ss49919201.blog"

lazy val blog = (project in file("."))
  .settings(
    name := "Blog",
    version := "0.1.0-SNAPSHOT",
    libraryDependencies ++= Seq(
      "org.scalatra" %% "scalatra-jakarta" % ScalatraVersion,
      "org.scalatra" %% "scalatra-scalatest-jakarta" % ScalatraVersion % "test",
      "ch.qos.logback" % "logback-classic" % "1.5.19" % "runtime",
      "org.commonmark" % "commonmark" % "0.24.0",
      "org.yaml" % "snakeyaml" % "2.3",
    ),
  )

enablePlugins(SbtTwirl)
enablePlugins(SbtWar)

Test / fork := true
