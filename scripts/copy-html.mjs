// Copy src/index.html to public/index.html.

import helper from "./helper.js"

const { publicPathFor, sourcePathFor, copyFile } = helper

const fileName = "index.html";

copyFile(sourcePathFor(fileName), publicPathFor(fileName));

console.log(`Copied ${fileName} from src/ to public/`);