
const { run: runCommand } = require("../helper")

function run(args) {
  try {
    return runCommand("gh", args)
  } catch ({ message, cause: { code, stderr } }) {
    if (code === "ENOENT") console.info("Install GitHub CLI (gh) from https://cli.github.com/")
    else if (stderr.includes("authentication") || stderr.includes("not logged in")) {
      console.info("Run `gh auth login` to authenticate GitHub CLI")
    }

    throw new Error(message.trim())
  }
}

exports.run = run