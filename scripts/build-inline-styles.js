// Read public/index.html, find all linked stylesheets and replace then with an inline <style> tag.

const fileSystem = require("fs")
const path = require("path")

const publicPath = "../public"

const htmlFileName = "index.html"
const htmlPath = path.resolve(__dirname, publicPath, `${htmlFileName}`)
const htmlContent = fileSystem.readFileSync(htmlPath, "utf-8")

const cssPath = (href) => path.resolve(__dirname, publicPath, href)
const cssContent = (filepath) => fileSystem.readFileSync(filepath, "utf-8")

const stylesheetTagFinder = /<link\s+rel="stylesheet"\s+href="([^"]+)"\s*\/?>/g
const stylesheetTagMatches = Array.from(htmlContent.matchAll(stylesheetTagFinder))
const stylesheetTags = stylesheetTagMatches.map(([tag]) => tag)
const stylesheetTagContents = stylesheetTagMatches.map(([, href]) => cssContent(cssPath(href))).join("").replaceAll(/\n/g, "")

const styleTag = (content) => `<style>${content}</style>`
const updatedHtmlContent = htmlContent
  .replace(stylesheetTags[0], `${styleTag(stylesheetTagContents)}${stylesheetTags[0]}`)
  .replaceAll(stylesheetTagFinder, "")

fileSystem.writeFileSync(htmlPath, updatedHtmlContent, "utf-8")

console.log(`Stylesheets inlined into ${htmlFileName}`)
