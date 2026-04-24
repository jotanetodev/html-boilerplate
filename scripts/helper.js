const fileSystem = require("fs")
const path = require("path")
const { execFileSync } = require("child_process")

const publicPath = "public/"
const sourcePath = "src/"

const pathFor = (relativePath) => path.resolve(__dirname, "..", relativePath)
const publicPathFor = (relativePath) => path.resolve(__dirname, `../${publicPath}`, relativePath)
const sourcePathFor = (relativePath) => path.resolve(__dirname, `../${sourcePath}`, relativePath)

const normalizeArgName = (argName) => `--${argName.replace(/^--(.*)$/, "$1")}`
const arg = (argName) => process.argv.find((arg) => arg.startsWith(normalizeArgName(argName)))
const argValue = (argName) => arg(argName)?.match(new RegExp(`^${normalizeArgName(argName)}=?(.*)$`))[1]

function readFile(filePath) {
  try {
    return fileSystem.readFileSync(filePath, "utf-8")
  } catch (error) {
    console.error(error.message)
  }
}

function writeFile(filePath, content) {
  try {
    fileSystem.writeFileSync(filePath, content, "utf-8")
  } catch (error) {
    console.error(error.message)
  }
}

function copyFile(sourcePath, destinationPath) {
  try {
    fileSystem.copyFileSync(sourcePath, destinationPath)
  } catch (error) {
    console.error(error.message)
  }
}

function deleteFile(filePath) {
  try {
    fileSystem.unlinkSync(filePath)
  } catch (error) {
    console.error(error.message)
  }
}

function run(command, args = [], { noArgs = false } = {}) {
  try {
    if (!noArgs && args.length <= 0) throw new Error(`No arguments provided to \`${command}\``)

    return execFileSync(command, args, {
      cwd: pathFor("."),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).toString().trim()
  } catch (error) {
    const stderr = error?.stderr?.toString()?.trim() ?? ""

    if (error.code === "ENOENT") console.error(`Command \`${command}\` not found`)
    if (error.message.includes("No arguments provided")) console.error(error.message)

    throw new Error(error.message, { cause: { code: error.code, stderr } })
  }
}

function tagContent(string, tagName, { index = null, newContent = null } = {}) {
  if (!string || !tagName) throw new Error("`string` and `tagName` are required parameters")

  const indexes = [index].flat().filter((_) => typeof _ === "number" && _ >= 0)
  const matches =
    Array.from(string.matchAll(new RegExp(`<${tagName}>([^<]*)</${tagName}>`, "gi")))
      .map(([outerHTML, innerHTML]) => [outerHTML, innerHTML])
  if (matches.length <= 0) return string

  if (newContent === null) return tagContentFetch(matches, indexes)
  return tagContentReplace(matches, indexes, newContent)
}

function tagContentFetch(matches, indexes) {
  if (indexes.length === 0) return matches
  return matches.filter((_, index) => indexes.includes(index))
}

function tagContentReplace(matches, indexes, content) {
  const replaced = ([outerHTML, innerHTML], matchIndex) => [
    outerHTML,
    outerHTML.replace(new RegExp(`${innerHTML}`), (Array.isArray(content) ? content[matchIndex] : content) || innerHTML)
  ]

  if (indexes.length === 0) return matches.map(replaced)
  return matches.filter((_, index) => indexes.includes(index)).map(replaced)
}

exports.publicPath = publicPath
exports.sourcePath = sourcePath

exports.pathFor = pathFor
exports.publicPathFor = publicPathFor
exports.sourcePathFor = sourcePathFor

exports.arg = arg
exports.argValue = argValue

exports.readFile = readFile
exports.writeFile = writeFile
exports.copyFile = copyFile
exports.deleteFile = deleteFile

exports.run = run

exports.tagContent = tagContent