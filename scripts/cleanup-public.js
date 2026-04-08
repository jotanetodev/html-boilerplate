// Remove files in public/ that are listed in .gitignore; optionally filter by file extension(s).

const fileSystem = require("fs")
const path = require("path")

const argName = "--ext="
const fileExtensions = ((arg) => {
  if (!arg) return ".*"
  return arg.match(new RegExp(`${argName}(.*)`))?.[1]?.split(",")?.join("|")
})(process.argv.find((arg) => arg.startsWith(`${argName}`)))

const publicPath = "../public"
const filePath = (fileName) => path.join(__dirname, publicPath, fileName)

const gitignorePath = "../.gitignore"
const gitignorePublicPath = "public/"
const gitignoreFile = fileSystem.readFileSync(path.join(__dirname, gitignorePath), "utf-8")

const fileNames = gitignoreFile
  .split("\n")
  .filter((line) => line.startsWith(gitignorePublicPath))
  .filter((line) => line.match(new RegExp(`\.(${fileExtensions})`)))
  .map((line) => line.replace(gitignorePublicPath, ""))

function deleteFile(path) {
  try {
    fileSystem.unlinkSync(path)
  } catch (error) {
    if (error.code === "ENOENT") return `File not found: ${path}`
    return error.message
  }
  return `Deleted: ${path}`
}

fileNames.forEach((fileName) => console.log(deleteFile(filePath(fileName))))