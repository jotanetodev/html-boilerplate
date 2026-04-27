const fileSystem = require("fs")
const path = require("path")
const { execFileSync } = require("child_process")
const cheerio = require("cheerio")

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

  const $ = cheerio.load(string)

  const indexes = [index].flat().filter((_) => typeof _ === "number" && _ >= 0)
  const matches = $(tagName).toArray().map(element => [$.html(element), $(element).html(), $(element)])

  if (matches.length <= 0) return string

  if (newContent === null) return tagContentFetch(matches, indexes)
  return tagContentReplace(matches, indexes, newContent).concat([$.root().html()])
}

function tagContentFetch(matches, indexes) {
  if (indexes.length === 0) return matches
  return matches.filter((_, index) => indexes.includes(index))
}

function tagContentReplace(matches, indexes, content) {
  const replaced = ([outerHTML, innerHTML, element], matchIndex) => [
    outerHTML,
    element.html(Array.isArray(content) ? content[matchIndex] || innerHTML : content).prop("outerHTML"),
    element
  ]

  if (indexes.length === 0) return matches.map(replaced)
  return matches.filter((_, index) => indexes.includes(index)).map(replaced)
}

function normalize(string, type) {
  const translitarated = string.normalize("NFD").replace(/[\u0300-\u036f]/g, "")

  switch (type) {
    case "downcase":
      return translitarated.toLowerCase()
    case "titlecase":
      return normalize(string, "kebabcase")
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    case "kebabcase":
      return normalize(string
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[^a-zA-Z0-9]+/g, "-"),
        "downcase"
      )
  }

  return string
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

exports.normalize = normalize