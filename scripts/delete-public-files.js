const fileSystem = require("fs")
const path = require("path")

const publicPath = `../public`

const gitignorePath = path.join(__dirname, "..", ".gitignore")
const fileNames = fileSystem.readFileSync(gitignorePath, "utf-8")
  .split("\n")
  .filter((line) => line.startsWith("public/"))
  .map((line) => line.replace("public/", ""))

const filePath = (fileName) => path.join(__dirname, publicPath, fileName)

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