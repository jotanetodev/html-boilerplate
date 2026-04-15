const { pathFor, readFile } = require("../helper")
const { run } = require("./run")
const { get: getRemote, setUpstream } = require("./remote")

function clean() {
  return Boolean(!run(["status", "--porcelain"]))
}

function update() {
  setUpstream()

  const upstreamUrl = getRemote("upstream")

  console.info(`Updating Git working directory files from ${upstreamUrl}`)
  
  if (!clean()) return console.warn("Git working directory MUST be clean to be updated")
  
  const files = readFile(pathFor(".gitupdate")).split("\n").filter(Boolean)
}

exports.update = update