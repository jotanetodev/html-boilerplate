// Remove files in public/ that are listed in .gitignore; optionally filter by file extension(s).

import { argValue, pathFor, publicPathFor, readFile, deleteFile } from "./helper.mjs"

const fileExtensions = argValue("ext")?.split(",")?.join("|") || ".*"

const gitignorePublicPath = "public/"
const gitignoreFile = readFile(pathFor(".gitignore"))

const fileNames = gitignoreFile
  .split("\n")
  .filter((line) => line.startsWith(gitignorePublicPath))
  .filter((line) => line.match(new RegExp(`\.(${fileExtensions})`)))
  .map((line) => line.replace(gitignorePublicPath, ""))

fileNames.forEach((fileName) => deleteFile(publicPathFor(fileName)))

console.log(`Cleaned up public/: ${fileExtensions}`);