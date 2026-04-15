const { run } = require("./run")

const rootRepository = "git@github.com:jotanetodev/html-boilerplate.git"

function exists(name) {
  return run(["remote"]).split("\n").includes(name)
}

function get(name = "origin") {
  return run(["remote", "get-url", name])
}

function add(url, name) {
  if (exists(name)) return console.warn(`Git remote \`${name}\` already exists`)
  run(["remote", "add", name, url])
  console.info(`Git remote \`${name}\` URL set to ${url}`)
}

function set(url, name = "origin") {
  if (get(name) === url) return console.warn(`Git remote \`${name}\` URL already set to ${url}`)
  run(["remote", "set-url", name, url])
  console.info(`Git remote \`${name}\` URL set to ${url}`)
}

function setUpstream() {
  if (exists("upstream")) set(rootRepository, "upstream")
  else add(rootRepository, "upstream")
}

exports.get = get
exports.set = set
exports.setUpstream = setUpstream