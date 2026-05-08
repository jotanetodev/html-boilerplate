// Remove files in public/ that are listed in .gitignore; optionally filter by file extension(s).

import { publicPath, pathFor, readFile, deleteFile } from "./helper.js"

const ignoreExtensions = ["html"].join("|")

const fileNames = readFile(pathFor(".gitignore"))
  .split("\n")
  .filter((line) => line.trim())
  .filter((path) => path.startsWith(publicPath))
  .filter((path) => !path.match(new RegExp(`\.(${ignoreExtensions})`)))
  
fileNames.forEach((path) => deleteFile(pathFor(path)))

console.info(`Cleaned up \`public/\` (${fileNames.join(", ")})`)