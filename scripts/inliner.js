// Inline source files into tags of public/index.html.

const { publicPathFor, readFile, writeFile } = require("./helper")

function inline(finder, inlineTagName) {
  const htmlPath = publicPathFor("index.html")
  const htmlContent = readFile(htmlPath)

  const match = Array.from(htmlContent.matchAll(finder))

  if (match.length <= 0) {
    console.warn(`No tags found with finder: ${finder}`)
    return false
  }

  const fetchContent = (filepath) => readFile(publicPathFor(filepath)) || ""

  const originalTags = match.map(([tag]) => tag)
  const originalContents = match.map(([, filePath]) => fetchContent(filePath)).join("").replaceAll(/\r?\n/g, "")
  const inlineTag = `<${inlineTagName}>${originalContents}</${inlineTagName}>`
  const updatedHtmlContent = htmlContent.replace(originalTags[0], `${inlineTag}${originalTags[0]}`).replaceAll(finder, "")

  writeFile(htmlPath, updatedHtmlContent)

  console.log(`Inlined <${inlineTagName}> into ${htmlPath}`)

  return true
}

exports.inline = inline