// Inline all linked stylesheets of public/index.html.

import { inline } from "./inliner.js"

const stylesheetTagFinder = /<link\s+rel="stylesheet"\s+href="([^"]+)"\s*\/?>/g
const inlineTagName = "style"

inline(stylesheetTagFinder, inlineTagName)
