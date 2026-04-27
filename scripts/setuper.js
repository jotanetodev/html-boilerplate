const { argValue, pathFor, sourcePathFor, readFile, writeFile, run, tagContent, normalize } = require("./helper")

function setup() {
  const projectName = argValue("name") || pathFor(".").split("/").slice(-1)[0]
  const projectDescription = argValue("description") || "Project forked from jotanetodev/html-boilerplate"

  const htmlPath = sourcePathFor("index.html")

  const newContents =
    [["title", normalize(projectName, "titlecase")],
    ["h1", normalize(projectName, "titlecase")],
    ["main", `<p><em>${projectDescription}</em></p>`]]

  const htmlContent = newContents.reduce(
    (content, [tagName, newContent]) => tagContent(content, tagName, { index: 0, newContent }).slice(-1)[0],
    readFile(htmlPath)
  )

  writeFile(htmlPath, htmlContent)

  run("npm", ["pkg", "set", `name=${normalize(projectName, "kebabcase")}`])
  run("npm", ["pkg", "set", `version=1.0.0`])
  run("npm", ["pkg", "set", `description=${projectDescription}`])
}

setup()