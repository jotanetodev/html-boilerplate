// Copy src/index.html to public/index.html.

import { publicPathFor, sourcePathFor, copyFile } from "./helper.js"

const fileNames = ["favicon.svg", "index.html"]

fileNames.forEach((fileName) => {
  copyFile(sourcePathFor(fileName), publicPathFor(fileName))
  
  console.info(`Copied ${fileName} from src/ to public/`)
})
