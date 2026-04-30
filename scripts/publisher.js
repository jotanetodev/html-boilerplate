const { argValue, pathFor, sourcePathFor, readFile, run: runCommand, HTMLElementContent, normalize } = require("./helper")

function run(args) {
  try {
    return runCommand("gh", args)
  } catch ({ message, cause: { code, stderr } }) {
    if (code === "ENOENT") console.info("Install GitHub CLI (gh) from https://cli.github.com/")
    else if (stderr.includes("authentication") || stderr.includes("not logged in"))
      console.info("Run `gh auth login` to authenticate GitHub CLI")
    throw new Error(message.trim())
  }
}

function repoOwner() {
  return run(["api", "user", "--jq", ".login"])
}

function repoName() {
  return normalize(
    argValue("name") || HTMLElementContent(readFile(sourcePathFor("index.html")), "title")[0],
    "kebab"
  )
}

function repoPath() {
  return `${repoOwner()}/${repoName()}`
}

function repoURL() {
  try {
    return JSON.parse(run(["repo", "view", repoPath(), "--json", "sshUrl"]))["sshUrl"]
  } catch (error) {
    if (error.message.includes("Could not resolve to a Repository")) return undefined
    throw error
  }
}

function repoVisibility() {
  if (!repoExists()) return ""
  return JSON.parse(run(["repo", "view", repoPath(), "--json", "visibility"]))["visibility"]

}

function repoExists() {
  return Boolean(repoURL())
}

function pageInfo() {
  return JSON.parse(run(["api", "-X", "GET", `repos/${repoPath()}/pages`]))
}

function pageExists() {
  try {
    return Boolean(pageInfo())
  } catch (error) {
    if (error.message.includes("Not Found")) return false
    throw error
  }
}

function publishRepo(visibility = argValue("visibility") || "public") {
  if (repoExists()) return console.warn("Github repository already exists")

  const validVisibility = ["public", "private", "internal"]
  if (!validVisibility.includes(visibility))
    throw new Error(`Invalid visibility; valid: ${validVisibility.join(", ")}`)

  run(["repo", "create", repoName(), `--${visibility}`, `--source="${pathFor(".")}"`, "--push"])
  runCommand("git", ["remote", "set-url", "origin", repoURL()])

  console.info("Github repository created and set as `origin`")
}

function enablePage() {
  if (!repoVisibility().match(/public/i))
    return console.error("Repository must be public to enable Github Pages")

  const exists = pageExists()

  if (exists && pageInfo()["build_type"].match(/workflow/i))
    return console.warn("Github Pages already enabled with build type \"workflow\"")
  
  const method = exists ? "PUT" : "POST"
  
  run(["api", "-X", `${method}`, `repos/${repoPath()}/pages`, "-f", "build_type=workflow"])

  console.info("Github Pages enabled and configured to deploy when `main` is pushed")
}

publishRepo()
enablePage()