// Inline source files into tags of public/index.html.

import { publicPathFor, readFile, readFileAsBase64, writeFile, HTMLElement } from "./helper.js"

function tagInliner(document, elements, filePathAttribute, inlineTag) {
  const content = elements
    .map((element) => element.getAttribute(filePathAttribute))
    .map((filePath) => readFile(publicPathFor(filePath)))
    .join("")
    .replace(/\n/g, "")

  return elements.map((element, index) => {
    if (index > 0) return element.remove()

    const newElement = document.createElement(inlineTag)

    newElement.innerHTML = content
    element.replaceWith(newElement)

    return newElement.outerHTML
  })
}

function attributeInliner(elements, filePathAttribute) {
  return elements.map((element) => {
    const content = readFileAsBase64(publicPathFor(element.getAttribute(filePathAttribute)))

    element.setAttribute(filePathAttribute, content)

    return element.outerHTML
  })
}

function inline(htmlPath, selector, filePathAttribute, { inlineTag = null } = {}) {
  const DOMString = readFile(htmlPath)
  const entities = HTMLElement(DOMString, selector)

  const DOM = entities.slice(-1)[0]
  const document = DOM.document
  const elements = entities.slice(0, -1)

  if (inlineTag) tagInliner(document, elements, filePathAttribute, inlineTag)
  else attributeInliner(elements, filePathAttribute)

  writeFile(htmlPath, DOM.serialize())

  console.log(`Inlined "${selector}" into ${htmlPath}`)
}

inline(publicPathFor("index.html"), "head > link[rel=stylesheet]", "href", { inlineTag: "style" })
inline(publicPathFor("index.html"), "head > script[src]", "src", { inlineTag: "script" })
inline(publicPathFor("index.html"), "head > link[rel=icon]", "href")

export { inline }