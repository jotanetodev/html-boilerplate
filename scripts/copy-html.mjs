// Copy src/index.html to public/index.html.

import { publicPathFor, sourcePathFor, copyFile } from "./helper.mjs"

const fileName = "index.html";

copyFile(sourcePathFor(fileName), publicPathFor(fileName));

console.log(`Copied ${fileName} from src/ to public/`);