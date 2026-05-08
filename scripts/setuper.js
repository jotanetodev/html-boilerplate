import {
  argValue,
  pathFor, sourcePathFor,
  readFile, writeFile,
  run,
  HTMLDOM,
  normalize,
} from "./helper.js"

const ogURL = "https://github.com/jotanetodev/html-boilerplate"

function setup() {
  const HTMLPath = sourcePathFor("index.html")
  const DOM = HTMLDOM(readFile(HTMLPath))

  const projectName = ((name) => {
    return {
      capitalized: normalize(name, "capitalize"),
      kebabed: normalize(name, "kebab")
    }
  })(argValue("name") || pathFor(".").split("/").slice(-1)[0])

  const projectDescription =
    argValue("description") ||
    `A minimal starter template for static HTML projects; forked from ${ogURL}`

  const commitMessage = `Initial setup for ${projectName.kebabed}`
  const commitHash = run("git", ["log", `--grep=${commitMessage}`, "--format=%H"])
    .split("\n")?.[0]

  if (commitHash) return console.warn(`Project was set up at ${commitHash}`)

  const newElementContents = [
    ["title", projectName.capitalized],
    ["body > h1", projectName.capitalized],
    ["main", `
      <p>Hello, ${projectName.capitalized}!</p>
      <p>Forked from
        <a href="${ogURL}" target="_blank">
          jotanetodev/html-boilerplate
        </a>
      </p>
    `]]

  const newAttributeValues =
    [["meta[name=description]", "content", projectDescription]]

  newElementContents.forEach(([selector, newContent]) =>
    DOM.document.querySelector(selector).innerHTML = newContent
  )

  newAttributeValues.forEach(([selector, attributeName, newValue]) =>
    DOM.document.querySelector(selector).setAttribute(attributeName, newValue)
  )

  writeFile(HTMLPath, DOM.serialize())

  run("npx", ["js-beautify", HTMLPath, "--replace"])

  run("npm", ["pkg", "set", `name=${projectName.kebabed}`])
  run("npm", ["pkg", "set", `version=1.0.0`])
  run("npm", ["pkg", "set", `description=${projectDescription}`])

  run("git", ["add", "package.json", "src/index.html"])
  run("git", ["commit", "-m", `${commitMessage}`])
}

setup()