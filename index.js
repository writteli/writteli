const content = require('./cms/content')
const helpers = require('./cms/helpers')
const _store = require('./cms/store')

module.exports.server = () => {
  content.watchForChanges(_store)
}

module.exports.compile = () => {
  content.compileOnce(_store)
}

module.exports.deploy = () => {
  helpers.deployViaFtp()
}
