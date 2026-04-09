// Inline all linked scripts of public/index.html.

const { inline } = require("./inliner")

const scriptTagFinder = /<script\s+src="([^"]+).*>\s*<\/script>/g
const inlineTagName = "script"

inline(scriptTagFinder, inlineTagName)
