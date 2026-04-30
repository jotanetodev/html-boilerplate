const fileSystem = require("fs")
const path = require("path")
const { execFileSync } = require("child_process")
const { JSDOM } = require("jsdom")

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

function HTMLDOM(HTMLString) {
  return new JSDOM(HTMLString)
}

function HTMLElement(HTMLString, selector, { getDOM = true, remove = false } = {}) {
  const DOM = HTMLDOM(HTMLString)
  const elements =
    [...DOM.window.document.querySelectorAll(selector)].map((element) => {
      if (remove === true) element.remove()
      return element
    })

  if (getDOM) return elements.concat(DOM)
  return elements
}

function HTMLElementContent(HTMLString, selector, { getDOM = true, newContent = undefined } = {}) {
  return HTMLElement(HTMLString, selector, { getDOM }).map((element) => {
    if (element.constructor.name === "JSDOM") return element

    if (newContent !== undefined) element.innerHTML = newContent
    return element.innerHTML
  })
}

function HTMLElementAttribute(HTMLString, selector, attributeName, { getDOM = true, newValue = undefined, remove = false } = {}) {
  return HTMLElement(HTMLString, selector, { getDOM }).map((element) => {
    if (element.constructor.name === "JSDOM") return element

    if (newValue !== undefined) element.setAttribute(attributeName, newValue)
    const value = element.getAttribute(attributeName)
    if (remove === true) element.removeAttribute(attributeName)
    return value
  })
}

function normalize(string, type) {
  const transliterated = string.normalize("NFD").replace(/[\u0300-\u036f]/g, "")

  switch (type) {
    case "lower":
      return transliterated.toLowerCase()
    case "capitalize":
      return normalize(string, "kebab")
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    case "kebab":
      return normalize(string
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[^a-zA-Z0-9]+/g, "-"),
        "lower"
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

exports.HTMLElement = HTMLElement
exports.HTMLElementContent = HTMLElementContent
exports.HTMLElementAttribute = HTMLElementAttribute

exports.normalize = normalize