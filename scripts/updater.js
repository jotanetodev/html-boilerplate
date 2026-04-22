// Update boilerplate files from an upstream GitHub repository.

const { run: runCommand, argValue } = require("./helper")

const ogURL = "git@github.com:jotanetodev/html-boilerplate.git"
const boilerplateFiles = [
  ".gitignore",
  ".stylelintrc.mjs",
  "package.json",
  ".github/",
  "scripts/",
  "src/scripts/base/",
  "src/styles/base/"
]

function run(args) {
  try {
    return runCommand("git", args)
  } catch ({ message, cause: { code, stderr } }) {
    if (code === "ENOENT") console.info("Install Git CLI (git) from https://git-scm.com/")
    throw new Error(message.trim())
  }
}

function remoteExists(name) {
  return run(["remote"]).split("\n").includes(name)
}

function branchExists(name) {
  return run(["branch", "--list", name]) !== ""
}

function currentBranch() {
  return run(["branch", "--show-current"])
}

function cleanBranch() {
  return run(["status", "--porcelain"]) === ""
}

function mergeSummary(goBack = 1, branch = currentBranch()) {
  const summaries = run(["log", branch, `${goBack * -1}`, "--name-status", "--pretty=format:%H"])
    .split("\n\n")
    .map((summary) => summary.toString().trim().split("\n"))

  summaries.forEach((summary) => {
    console.log(summary[0])
    summary
      .slice(1)
      .filter((line) => line.trim() !== "")
      .map((line) => line.split("\t"))
      .forEach(([status, file, fileRenamed]) => console.log(status, "\t", file, fileRenamed || ""));
  })
}

function update() {
  const url = argValue("from") || ogURL
  const parsedUrl = url.match(/github\.com[:/](?<owner>[^/]+)\/(?<repository>[^/.]+)/)?.groups || {}

  const { owner, repository } = parsedUrl
  if (!owner || !repository) throw new Error(`Invalid Git remote URL provided: ${url}`)

  const upstream = `upstream-${owner}-${repository}`
  const branch = "main"

  const updateFrom = currentBranch()
  const updateTo = `updater-${owner}-${repository}-${branch}`

  const reference = `${url} (${branch})`

  if (remoteExists(upstream)) run(["remote", "set-url", upstream, url])
  else run(["remote", "add", upstream, url])

  run(["stash", "-u"])

  run(["fetch", upstream, branch])

  if (branchExists(updateTo)) run(["switch", updateTo])
  else run(["switch", "-c", updateTo])
  if (currentBranch() !== updateTo) throw new Error(`Failed to switch to branch \`${updateTo}\``)

  run(["reset", "--hard", `${updateFrom}`])

  boilerplateFiles.forEach((file) => {
    try {
      run(["restore", "--source", `${upstream}/${branch}`, "--", file])
    } catch (error) {
      console.warn(`Failed to update \`${file}\` from ${reference}: ${error.message}`)
    }
  })

  if (cleanBranch()) {
    run(["switch", updateFrom])

    run(["stash", "pop"])

    run(["branch", "--delete", updateTo])

    return console.info(`No changes from ${reference}`)
  }

  run(["add", "-A"])

  run(["commit", "-m", `Update from ${reference}`])

  run(["switch", updateFrom])

  run(["stash", "pop"])

  try {
    run(["merge", updateTo])

    run(["branch", "--delete", updateTo])

    console.info(`Updated from ${reference}`)
    mergeSummary()
  } catch (error) {
    console.warn(`There're changes from ${reference}`)
    console.info(`Merge \`${updateTo}\` manually and delete it afterwards`)
    mergeSummary(1, updateTo)
  }

  run(["remote", "remove", upstream])
}

update()