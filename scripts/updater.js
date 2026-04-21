// Update boilerplate files from an upstream GitHub repository.

const { run: runCommand, argValue } = require("./helper")

const ogURL = "git@github.com:jotanetodev/html-boilerplate.git"
const boilerplateFiles = [
  ".gitignore",
  ".stylelintrc.mjs",
  "package.json",
  ".github",
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

function update() {
  const url = argValue("from") || ogURL
  const parsedUrl = url.match(/github\.com[:/](?<owner>[^/]+)\/(?<repository>[^/.]+)/)?.groups || {}

  const { owner, repository } = parsedUrl
  if (!owner || !repository) throw new Error(`Invalid Git remote URL provided: ${url}`)

  const upstream = `upstream-${owner}-${repository}`
  const branch = "main"

  const updateFrom = currentBranch()
  const updateTo = `updater-${owner}-${repository}-${branch}`

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
      console.warn(`Failed to update \`${file}\` from ${owner}/${repository}@${branch}: ${error.message}`)
    }
  })

  if (cleanBranch()) {
    run(["switch", updateFrom])

    run(["stash", "pop"])

    run(["branch", "--delete", updateTo])

    return console.info(`No changes from ${owner}/${repository}@${branch}`)
  }

  run(["add", "-A"])

  run(["commit", "-m", `Update from ${owner}/${repository}@${branch}`])

  run(["switch", updateFrom])

  run(["stash", "pop"])

  try {
    run(["merge", updateTo])

    run(["branch", "--delete", updateTo])

    console.info(`Updated from ${owner}/${repository}@${branch}`)
  } catch (error) {
    console.info(`There're changes from ${owner}/${repository}@${branch}; merge manually and delete \`${updateTo}\` afterwards`)
  }

  run(["remote", "remove", upstream])
}

update()