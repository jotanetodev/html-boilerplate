import {
  ogURL, buildProjectName, buildProjectDescription,
  sourcePathFor,
  readFile, writeFile,
  run,
  HTMLDocument,
  normalize,
} from "./helper.js"

function setup() {
  const HTMLPath = sourcePathFor("index.html")
  const document = HTMLDocument(readFile(HTMLPath))

  const projectName = ((name) =>
    ({ capital: normalize(name, "capitalize"), kebab: normalize(name, "kebab") }))(buildProjectName())
  const projectDescription = buildProjectDescription()

  const commitMessage = `Initial setup for ${projectName.kebab}`
  const commitHash = run("git", ["log", `--grep=${commitMessage}`, "--format=%H"])
    .split("\n")?.[0]

  if (commitHash) return console.warn(`Project was set up at ${commitHash}`)

  const newElementContents = [
    ["title", projectName.capital],
    ["body > h1", projectName.capital],
    ["main", `
      <p>Hello, ${projectName.capital}!</p>
      <p>Forked from
        <a href="${ogURL.http}" target="_blank">
          jotanetodev/html-boilerplate
        </a>
      </p>
    `]]

  const newAttributeValues =
    [["meta[name=description]", "content", projectDescription]]

  newElementContents.forEach(([selector, newContent]) =>
    document.querySelector(selector).innerHTML = newContent
  )

  newAttributeValues.forEach(([selector, attributeName, newValue]) =>
    document.querySelector(selector).setAttribute(attributeName, newValue)
  )

  writeFile(HTMLPath, document.toString())

  run("npx", ["js-beautify", HTMLPath, "--replace"])

  run("npm", ["pkg", "set", `name=${projectName.kebab}`])
  run("npm", ["pkg", "set", `version=1.0.0`])
  run("npm", ["pkg", "set", `description=${projectDescription}`])

  run("git", ["add", "package.json", "src/index.html"])
  run("git", ["commit", "-m", `${commitMessage}`])
}

setup()