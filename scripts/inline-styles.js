// Inline all linked stylesheets of public/index.html.

const { inline } = require("./inliner")

const stylesheetTagFinder = /<link\s+rel="stylesheet"\s+href="([^"]+)"\s*\/?>/g
const inlineTagName = "style"

inline(stylesheetTagFinder, inlineTagName)
