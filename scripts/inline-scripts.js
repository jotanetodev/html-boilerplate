// Inline all linked scripts of public/index.html.

import { inline } from "./inliner.js"

const scriptTagFinder = /<script\s+src="([^"]+).*>\s*<\/script>/g
const inlineTagName = "script"

inline(scriptTagFinder, inlineTagName)
