import * as fileSystem from "node:fs"
import * as path from "node:path"
import { execFileSync } from "node:child_process"
import { fileURLToPath } from "node:url"
import { parseHTML } from "linkedom"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const publicPath = "public/"
const sourcePath = "src/"

const mimeTypeByExtension = {
  ".avif": "image/avif",
  ".css": "text/css",
  ".gif": "image/gif",
  ".html": "text/html",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain",
  ".webp": "image/webp",
}

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

function readFileAsBase64(filePath, { forHTMLAttribute = true, mimeType } = {}) {
  try {
    const base64Content = fileSystem.readFileSync(filePath).toString("base64")

    if (forHTMLAttribute !== true) return base64Content

    const fileExtension = path.extname(filePath).toLowerCase()
    const resolvedMimeType =
      mimeType ?? mimeTypeByExtension[fileExtension] ?? "application/octet-stream"

    return `data:${resolvedMimeType};base64,${base64Content}`
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

class HTMLDocumentWrapper {
  constructor(document) {
    this.document = document
  }

  serialize() {
    return this.document.toString()
  }
}

function HTMLDOM(HTMLString) {
  return new HTMLDocumentWrapper(parseHTML(HTMLString).document)
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

export {
  publicPath,
  sourcePath,
  pathFor,
  publicPathFor,
  sourcePathFor,
  arg,
  argValue,
  readFile,
  readFileAsBase64,
  writeFile,
  copyFile,
  deleteFile,
  run,
  HTMLDOM,
  normalize,
}