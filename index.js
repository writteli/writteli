const content = require('./cms/content')
const helpers = require('./cms/helpers')
const _store = require('./cms/store')

module.exports.init = () => {
  content.init(_store)
}

module.exports.once = () => {
  content.compileOnce(_store)
}

module.exports.assets = () => {
  content.recompileAssetsServer(_store)
}

module.exports.deploy = () => {
  helpers.deployViaFtp()
}
