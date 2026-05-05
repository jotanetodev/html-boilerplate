// Inline all linked stylesheets of public/index.html.

import { inline } from "./inliner.mjs"

const stylesheetTagFinder = /<link\s+rel="stylesheet"\s+href="([^"]+)"\s*\/?>/g
const inlineTagName = "style"

inline(stylesheetTagFinder, inlineTagName)
