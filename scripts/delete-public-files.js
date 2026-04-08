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
  fileSystem.unlink(path, (error) => {
    if (error) {
      if (error.code === 'ENOENT') {
        console.log(`File not found: ${path}`)
      } else {
        console.error(`Error deleting file: ${error.message}`)
      }

      return false
    }

    console.log(`Deleted: ${path}`)
  })
}

fileNames.forEach((fileName) => deleteFile(filePath(fileName)))