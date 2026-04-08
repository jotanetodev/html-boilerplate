const fileSystem = require("fs");
const path = require("path");

const fileName = "index.html";

const sourceFilePath = `../src/${fileName}`;
const publicFilePath = `../public/${fileName}`;

const source = path.join(__dirname, sourceFilePath);
const public = path.join(__dirname, publicFilePath);

fileSystem.copyFileSync(source, public);

console.log(`Copied ${fileName} from src to public`);