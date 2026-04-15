const { run } = require("./run")
const { path: repoPath, exists: repoExists } = require("./repository")

const notFound = ({ message }) => message.includes("Not Found")

function exists() {
  try {
    const repo = repoPath()
    if (repoExists()) return Boolean(run(["api", "-X", "GET", `repos/${repo}/pages`]))
    throw new Error(`GitHub repository ${repo} does not exist`)
  } catch (error) {
    if (notFound(error)) return false
    console.error("Failed to check GitHub Pages existence")
    throw error
  }
}

function enable() {
  try {
    const repo = repoPath()
    if (!exists()) return Boolean(run(["api", "-X", "POST", `repos/${repo}/pages`, "-f", "build_type=workflow"]))
    console.warn("GitHub Pages already enabled")
    return false
  } catch (error) {
    if (notFound(error)) return false
    console.error("Failed to enable GitHub Pages")
    throw error
  }
}

exports.enable = enable