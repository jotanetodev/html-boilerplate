// Inline source files into tags of public/index.html.

import { pathFor, publicPathFor, readFile, readFileAsBase64, writeFile, HTMLDocument } from "./helper.js"

const relativePath = (path) => path.replace(pathFor("."), "")

function tagInliner(document, elementFilePaths, inlineTag) {
  const newElement = document.createElement(inlineTag)
  const content = elementFilePaths.map(([, path]) => readFile(path))
    .filter((fileContent) => fileContent)
    .join("").replace(/\n/g, "")

  newElement.innerHTML = content
  elementFilePaths[0]?.[0].replaceWith(newElement)
  elementFilePaths.slice(1).forEach(([element,]) => element.remove())

  console.info(`Inlined ${elementFilePaths.map(([, path]) => relativePath(path)).join(", ")} into <${inlineTag}>`)
}

function attributeInliner(filePathAttribute, elementFilePaths) {
  const elementFileContents = elementFilePaths.map(([element, path]) =>
    [element, path, readFileAsBase64(path)]
  ).filter(([, fileContent]) => fileContent)

  elementFileContents.forEach(([element, path, content]) => {
    element.setAttribute(filePathAttribute, content)

    console.info(`Inlined ${relativePath(path)} into <${element.nodeName.toLowerCase()}> attribute ${filePathAttribute}`)
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
}

inline(publicPathFor("index.html"), "head > link[rel=stylesheet]", "href", { inlineTag: "style" })
inline(publicPathFor("index.html"), "head > script[src]", "src", { inlineTag: "script" })
inline(publicPathFor("index.html"), "head > link[rel=icon]", "href")
