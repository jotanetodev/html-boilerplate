const fileSystem = require("fs")
const path = require("path")

const publicPath = "public/"
const sourcePath = "src/"

const pathFor = (relativePath) => path.resolve(__dirname, relativePath)
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

exports.publicPath = publicPath
exports.sourcePath = sourcePath

exports.pathFor = pathFor
exports.publicPathFor = publicPathFor
exports.sourcePathFor = sourcePathFor

exports.arg = arg
exports.argValue = argValue

exports.readFile = readFile
exports.writeFile = writeFile