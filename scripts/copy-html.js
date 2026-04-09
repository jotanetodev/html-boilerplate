// Copy src/index.html to public/index.html.

const { publicPathFor, sourcePathFor, copyFile } = require("./helper")

const fileName = "index.html";

copyFile(sourcePathFor(fileName), publicPathFor(fileName));

console.log(`Copied ${fileName} from src/ to public/`);