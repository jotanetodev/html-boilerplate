
const { run: runCommand } = require("../helper")

const noRun = "Git MUST be on `main` branch to run commands"

function run(args) {
  try {
    if (runCommand("git", ["branch", "--show-current"]) === "main") return runCommand("git", args)
    console.error(noRun)
    throw new Error(noRun, { cause: { code: null, stderr: null } })
  } catch ({ message, cause: { code, stderr } }) {
    if (code === "ENOENT") console.info("Install Git CLI (git) from https://git-scm.com/")

    throw new Error(message.trim())
  }
}

exports.run = run