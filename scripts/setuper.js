const { argValue, pathFor, sourcePathFor, readFile, writeFile, run, HTMLElementContent, HTMLElementAttribute, normalize } = require("./helper")

function setup() {
  const htmlPath = sourcePathFor("index.html")
  let htmlContent = readFile(htmlPath)

  const projectName = argValue("name") || pathFor(".").split("/").slice(-1)[0]
  const projectDescription = argValue("description") ||
    "A minimal starter template for static HTML projects; forked from https://github.com/jotanetodev/html-boilerplate"

  const newElementContents =
    [["title", normalize(projectName, "capitalize")],
    ["h1", normalize(projectName, "capitalize")],
    ["main", `
      <p>Hello, ${normalize(projectName, "capitalize")}!</p>
      <p>Forked from
        <a href="https://github.com/jotanetodev/html-boilerplate" target="_blank">jotanetodev/html-boilerplate</a>
      </p>
    `]]

  htmlContent =
    newElementContents.reduce(
      (content, [selector, newContent]) => HTMLElementContent(content, selector, { newContent }).slice(-1)[0].serialize(),
      htmlContent
    )

  const newAttributeValues =
    [["meta[name=description]", "content", projectDescription]]

  htmlContent = newAttributeValues.reduce(
    (content, [selector, name, newValue]) => HTMLElementAttribute(content, selector, name, { newValue }).slice(-1)[0].serialize(),
    htmlContent
  )

  writeFile(htmlPath, htmlContent)
  
  run("npx", ["js-beautify", htmlPath, "--replace"])

  run("npm", ["pkg", "set", `name=${normalize(projectName, "kebab")}`])
  run("npm", ["pkg", "set", `version=1.0.0`])
  run("npm", ["pkg", "set", `description=${projectDescription}`])
}

setup()