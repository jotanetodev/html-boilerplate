const { run } = require("./run")
const { set: gitRemoteSet } = require("../git/remote")
const { pathFor, readFile } = require("../helper")

const notFound = ({ message }) => message.includes("Could not resolve to a Repository")

function owner() {
  return run(["api", "user", "--jq", ".login"])
}

function name() {
  return readFile(pathFor(".gitrepository")).split("\n").filter(Boolean)[0]
}

function path() {
  return `${owner()}/${name()}`
}

function url() {
  try {
    return JSON.parse(run(["repo", "view", path(), "--json", "sshUrl"]))["sshUrl"]
  } catch (error) {
    if (notFound(error)) return undefined
    throw error
  }
}

function exists() {
  return Boolean(url())
}

function create(visibility = "public") {
  try {
    if (exists()) {
      console.warn("Github repository already exists")
      return false
    }
    
    const newPath = path()

    console.info(`Creating GitHub repository ${newPath} (${visibility})`)

    const validVisibility = ["public", "private", "internal"]
    if (!validVisibility.includes(visibility))
      throw new Error(`Invalid visibility; valid: ${validVisibility.join(", ")}`)

    const result = run(["repo", "create", `${newPath}`, `--${visibility}`])
    if (result === `https://github.com/${newPath}`) return true

    throw new Error(result)
  } catch (error) {
    console.error(error.message)

    return false
  }
}

function sync() {
  try {
    console.info("Syncing Git and GitHub URLs")
    gitRemoteSet(url())
  } catch (error) {
    console.error("Failed to sync Git and GitHub URLs")
    throw error
  }
}

function setup(){
  create()
  sync()
}

exports.path = path
exports.exists = exists
exports.setup = setup