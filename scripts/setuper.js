import {
  ogURL, buildProjectName, buildProjectDescription,
  argValue,
  sourcePathFor,
  readFile, writeFile,
  run,
  HTMLDocument,
  normalize,
} from "./helper.js"

function clean(file) {
  return run("git", ["status", "--porcelain", "--", file]) === ""
}

function changed(file) {
  return run("git", ["diff", "HEAD", file]) !== ""
}

function setup() {
  if (!clean("package.json") || !clean("src/index.html") || !clean("src/styles/index.scss"))
    return console.error("Files `package.json` and `src/index.html` must be clean before setup")

  const HTMLPath = sourcePathFor("index.html")
  const SCSSPath = sourcePathFor("styles/index.scss")

  const document = HTMLDocument(readFile(HTMLPath))

  const projectName = ((name) =>
    ({ capital: normalize(name, "capitalize"), kebab: normalize(name, "kebab") }))(buildProjectName())
  const projectDescription = buildProjectDescription()

  const commitMessage = `Initial setup for ${projectName.kebab}`
  const commitHash = run("git", ["log", `--grep=${commitMessage}`, "--format=%H"])
    .split("\n")?.[0]

  if (typeof argValue("force") !== "string" && commitHash)
    return console.warn(`Project was set up at ${commitHash}`)

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
  writeFile(SCSSPath, "\n")

  run("npx", ["js-beautify", HTMLPath, "--replace"])

  run("npm", ["pkg", "set", `name=${projectName.kebab}`])
  run("npm", ["pkg", "set", `version=1.0.0`])
  run("npm", ["pkg", "set", `description=${projectDescription}`])

  if (!changed("package.json") && !changed("src/index.html") && !changed("src/styles/index.scss"))
    return console.warn("Nothing changed on setup")

  run("git", ["add", "package.json", "src/index.html"])
  run("git", ["commit", "-m", `${commitMessage}`])

  console.info(`${commitMessage} complete and committed`)
}

setup()