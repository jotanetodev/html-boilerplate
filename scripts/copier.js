// Copy src/index.html to public/index.html.

import { publicPathFor, sourcePathFor, copyFile } from "./helper.js"

const fileName = "index.html";

copyFile(sourcePathFor(fileName), publicPathFor(fileName));

console.log(`Copied ${fileName} from src/ to public/`);