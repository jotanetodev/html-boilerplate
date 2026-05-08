// Inline source files into tags of public/index.html.

import { publicPathFor, readFile, readFileAsBase64, writeFile, HTMLDocument } from "./helper.js"

function tagInliner(document, elementFilePaths, inlineTag) {
  const newElement = document.createElement(inlineTag)
  const content = elementFilePaths.map(([, path]) => readFile(path))
    .filter((fileContent) => fileContent)
    .join("").replace(/\n/g, "")

  newElement.innerHTML = content
  elementFilePaths[0]?.[0].replaceWith(newElement)
  elementFilePaths.slice(1).forEach(([element,]) => element.remove())
}

function attributeInliner(filePathAttribute, elementFilePaths) {
  const elementFileContents = elementFilePaths.map(([element, path]) =>
    [element, readFileAsBase64(path)]
  ).filter(([, fileContent]) => fileContent)

  elementFileContents.forEach(([element, content]) => {
    element.setAttribute(filePathAttribute, content)
  })
}

function inline(htmlPath, selector, filePathAttribute, { inlineTag = null } = {}) {
  const document = HTMLDocument(readFile(htmlPath))
  const elementFilePaths = document.querySelectorAll(selector).map((element) =>
    [element, publicPathFor(element.getAttribute(filePathAttribute))]
  )
  
  if (inlineTag) tagInliner(document, elementFilePaths, inlineTag)
  else attributeInliner(filePathAttribute, elementFilePaths)

  writeFile(htmlPath, document.toString())

  console.log(`Inlined "${selector}" into ${htmlPath}`)
}

inline(publicPathFor("index.html"), "head > link[rel=stylesheet]", "href", { inlineTag: "style" })
inline(publicPathFor("index.html"), "head > script[src]", "src", { inlineTag: "script" })
inline(publicPathFor("index.html"), "head > link[rel=icon]", "href")

export { inline }