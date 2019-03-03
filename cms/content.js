const showdown = require('showdown')
const fs = require('fs')
const pug = require('pug')
const CONFIG = require('./../config')
const _helpers = require('./helpers')
const path = require('path')
const watch = require('node-watch')

const _mdConverter = new showdown.Converter({metadata: true})
_mdConverter.setFlavor('github')

module.exports = {
  getPages: (_store) => {
    return new Promise((resolve, reject) => {
      fs.readdir(path.normalize('./contents/'), (err, files) => {
        if (!err) {
          let pagesArr = []
          let listsArr = []
          files.forEach(obj => {
            if (obj.includes('--page')) {
              pagesArr.push({
                id: listsArr.length + 1,
                path: path.normalize(`./contents/${obj}/index.md`),
                template: path.normalize(`./theme/${CONFIG.theme}/${obj}.pug`),
                meta: {},
                contents: ''
              })
            } else if (obj.includes('--list')) {
              listsArr.push({
                id: listsArr.length + 1,
                path: path.normalize(`./contents/${obj}/index.md`),
                entriesPath: path.normalize(`./contents/${obj}/list/`),
                template: path.normalize(`./theme/${CONFIG.theme}/${obj}.pug`),
                entryTemplate: path.normalize(`./theme/${CONFIG.theme}/${obj}--entry.pug`),
                meta: {},
                contents: '',
                entries: []
              })
            }
          })
          _store.pages = pagesArr
          _store.lists = listsArr
          resolve(_store)
        } else {
          reject(err)
        }
      })
    })
  },
  getListEntries: (_path, listObj) => {
    return new Promise((resolve, reject) => {
      fs.readdir(path.normalize(_path), (err, files) => {
        if (!err) {
          let contents = []
          let promises = []
          files.forEach((obj, index) => {
            promises.push(module.exports.getMdFileContents(`${_path}${obj}`, index, path.normalize(`./output/${listObj.slug}/`), listObj))
          })
          Promise.all(promises).then(arr => {
            if (CONFIG.excludeDrafts === true) {
              arr = arr.filter(obj => !obj.meta.draft)
            }
            resolve(arr.reverse())
          })
        } else {
          reject(err)
        }
      })
    })
  },
  getMdFileContents: (_path, _index, _parentOutputPath, parentObj) => {
    return new Promise((resolve, reject) => {
      fs.readFile(path.normalize(_path), 'utf8', (err, data) => {
        if (!err) {
          const mdObj = _mdConverter.makeHtml(data)
          const meta = _mdConverter.getMetadata()
          let obj = {
            id: _index + 1,
            meta: meta,
            slug: meta && meta.slug ? meta.slug : _helpers.slugify(meta.title || Date.now()),
            content: mdObj
          }
          obj.output = _parentOutputPath ? `${_parentOutputPath}${obj.slug}/index.html` :`./output/${obj.slug}/index.html`
          if (parentObj && parentObj.slug) {
            obj.url = `/${parentObj.slug}/${obj.slug}/`
          }
          if (parentObj && parentObj.entryTemplate) {
            obj.template = parentObj.entryTemplate
          }
          resolve(obj)
        } else {
          reject(err)
        }
      })
    })
  },
  getAllContent: (_store) => {
    return module.exports.getPages(_store).then(() => {
      let promises = []
      // get all lists file contents
      _store.lists.map((list, index) => {
        promises.push(module.exports.getMdFileContents(list.path, index).then(obj => {
          _store.lists[index] = {..._store.lists[index], ...obj}
        }))
        promises.push(module.exports.getListEntries(list.entriesPath, list).then(arr => {
          _store.lists[index].entries = arr
          return Promise.resolve()
        }))
      })
      // get all pages file contents
      _store.pages.map((page, index) => {
        promises.push(module.exports.getMdFileContents(page.path, index).then(obj => {
          _store.pages[index] = {...page, ...obj}
        }))
      })
      // resolve all files, generate slugs/meta etc.
      return Promise.all(promises).then(() => {
        const listPromises = []
        // get all list entries contents
        _store.lists.map((list, index) => {
          listPromises.push(module.exports.getListEntries(list.entriesPath, list).then(arr => {
            _store.lists[index].entries = arr
            return Promise.resolve()
          }))
        })
        return Promise.all(listPromises).then(() => {
          return Promise.resolve(_store)
        })
      })
    })
  },
  compilePage: (pageObj) => {
    const compiled = pug.compileFile(pageObj.template)
    return compiled
  },
  createOutputFolders: (_store) => {
    let promises = []
    // create output folders for pages
    _store.pages.map(page => {
      promises.push(new Promise((resolve, reject) => {
        try {
          _helpers.mkDirByPathSync(page.output.slice(0, -10))
          resolve()
        } catch (err) {
          reject(err)
        }
      }))
    })
    // create output folders list index
    _store.lists.map(list => {
      promises.push(new Promise((resolve, reject) => {
        try {
          _helpers.mkDirByPathSync(list.output.slice(0, -10))
          resolve()
        } catch (err) {
          reject(err)
        }
      }))
    })
    // create output folders for list entries / pagination
    _store.lists.map(list => {
      // if list has pagination
      if (CONFIG && CONFIG.pagination && CONFIG.pagination[list.slug]) {
        const perPage = CONFIG.pagination[list.slug]
        let pages = Math.ceil(list.entries.length / perPage)
        list.paginationLinks = []
        for (let i = 0; i < pages; i++) {
          let item = {}
          // let first page doesn't have to contain page number
          list.paginationLinks.push(i === 0 ? list.output : `${list.output.slice(0, -11)}/${CONFIG.paginationSlug}${i + 1}/index.html`)
          // item[i + 1] = i === 0 ? list.output : `${list.output.slice(0, -11)}/${CONFIG.paginationSlug}${i + 1}/index.html`
          // list.paginationLinks.push(item)
          promises.push(new Promise((resolve, reject) => {
            try {
              _helpers.mkDirByPathSync(path.normalize(list.paginationLinks[i].slice(0, -10)))
              resolve()
            } catch (error) {
              reject(error)
            }
          }))
        }
      }
      // prepare folders for list entries
      list.entries.map((entry) => {
        promises.push(new Promise((resolve, reject) => {
          try {
            _helpers.mkDirByPathSync(path.normalize(entry.output.slice(0, -10)))
            resolve()
          } catch (error) {
            reject(error)
          }
        }))
      })
    })
    return Promise.all(promises).then(() => {
      return Promise.resolve(_store)
    })
  },
  createOutputPageFiles: (_store, contentTemplateOptions = {}) => {
    let promises = []
    _store.pages.map(page => {
      promises.push(new Promise((resolve, reject) => {
        const contentTemplate = pug.compileFile(page.template)
        const parsedContentTemplate = contentTemplate({
          title: page.meta && page.meta.title ? page.meta.title : '',
          date: page.meta && page.meta.date ? page.meta.date : '',
          tags: page.meta && page.meta.tags ? page.meta.tags : '',
          description: page.meta && page.meta.description ? page.meta.description : '',
          content: page.content,
          meta: page.meta || {},
          ...contentTemplateOptions
        })
        fs.writeFile(path.normalize(page.output), parsedContentTemplate, (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      }))
    })
    return Promise.all(promises).then(() => {
      return Promise.resolve(_store)
    })
  },
  createListJsonFiles: (_store) => {
    let promises = []
    _store.lists.map(list => {
      promises.push(new Promise((resolve, reject) => {
        let url = list.output.split('/')
        url[url.length - 1] = 'list.json'
        url = `./${url.join('/')}`
        let entries = [...list.entries]
        let parsedList = []
        entries.map(entry => {
          parsedList.push({
            id: entry.id,
            title: entry.meta.title,
            date: entry.meta.date,
            category: entry.meta.category,
            tags: entry.meta.tags,
            url: entry.output.slice(6, -10)
          })
        })
        fs.writeFile(path.normalize(url), JSON.stringify({list: parsedList}), (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      }))
    })
    return Promise.all(promises).then(() => {
      return Promise.resolve(_store)
    })
  },
  createOutputListIndexFiles: (_store, contentTemplateOptions = {}) => {
    let promises = []
    _store.lists.map(list => {
      // list template
      const contentTemplate = pug.compileFile(list.template)
      // list object
      let listObject = {
        title: list.meta && list.meta.title ? list.meta.title : '',
        date: list.meta && list.meta.date ? list.meta.date : '',
        tags: list.meta && list.meta.tags ? list.meta.tags : '',
        description: list.meta && list.meta.description ? list.meta.description : '',
        list: list.entries || [],
        content: list.content,
        meta: list.meta || {},
        ...contentTemplateOptions,
      }
      // add pagination helper property if list has configured pagination feature
      if (list.paginationLinks && list.paginationLinks.length > 1) {
        listObject.paginationLinks = []
        list.paginationLinks.map(link => {
          listObject.paginationLinks.push(`${link.slice(8, -10)}`)
        })
      }
      // page size variable
      const pageSize = CONFIG.pagination[list.slug]
      // if list has pagination
      if (list.paginationLinks && list.paginationLinks.length > 1) {
        list.paginationLinks.map((page, index) => {
          const paginatedListOfEntries = list && list.entries ? list.entries.slice(index * pageSize, (index + 1) * pageSize) : []
          listObject.list = paginatedListOfEntries || []
          // add also active page helper property
          listObject.currentPage = index + 1
          promises.push(new Promise((resolve, reject) => {
            const parsedContentTemplate = contentTemplate(listObject)
            fs.writeFile(path.normalize(page), parsedContentTemplate, (err) => {
              if (err) {
                reject(err)
              } else {
                resolve()
              }
            })
          }))
        })
      } else {
        // if list doesn't have pagination
        promises.push(new Promise((resolve, reject) => {
          const parsedContentTemplate = contentTemplate(listObject)
          fs.writeFile(path.normalize(list.output), parsedContentTemplate, (err) => {
            if (err) {
              reject(err)
            } else {
              resolve()
            }
          })
        }))
      }
    })
    return Promise.all(promises).then(() => {
      return Promise.resolve(_store)
    })
  },
  createOutputListEntryFiles: (_store, contentTemplateOptions = {}) => {
    let promises = []
    _store.lists.map(list => {
      list.entries.map(entry => {
        promises.push(new Promise((resolve, reject) => {
          const contentTemplate = pug.compileFile(entry.template)
          const parsedContentTemplate = contentTemplate({
            title: entry.meta && entry.meta.title ? entry.meta.title : '',
            date: entry.meta && entry.meta.date ? entry.meta.date : '',
            tags: entry.meta && entry.meta.tags ? entry.meta.tags : '',
            description: entry.meta && entry.meta.description ? entry.meta.description : '',
            content: entry.content,
            meta: entry.meta || {},
            ...contentTemplateOptions
          })
          fs.writeFile(path.normalize(entry.output), parsedContentTemplate, (err) => {
            if (err) {
              reject(err)
            } else {
              resolve()
            }
          })
        }))
      })
    })
    return Promise.all(promises).then(() => {
      return Promise.resolve(_store)
    })
  },
  createOutputFiles: (_store) => {
    return module.exports.createOutputPageFiles(_store).then(() => {
      return module.exports.createOutputListIndexFiles(_store).then(() => {
        return module.exports.createOutputListEntryFiles(_store).then(() => {
          return module.exports.prepareAssets().then(() => {
            return Promise.resolve(_store)
          })
        })
      })
    })
  },
  prepareAssets: () => {
    _helpers.mkDirByPathSync('./output/assets/css')
    _helpers.mkDirByPathSync('./output/assets/js')
    _helpers.mkDirByPathSync('./output/assets/img')
    _helpers.mkDirByPathSync('./output/static/')
    _helpers.mkDirByPathSync('./output/vendor/')
    let promises = []
    // copy image assets
    promises.push(_helpers.copyFolderContents(`./theme/${CONFIG.theme}/assets/img/`, './output/assets/img/'))
    // copy content images/static files
    promises.push(_helpers.copyFolderContents('./contents/static/', './output/static/'))
    // copy vendor files
    promises.push(_helpers.copyFolderRecursively(CONFIG.vendorsPath || `./theme/${CONFIG.theme}/vendor/`, './output/vendor/'))
    // compile sass
    promises.push(_helpers.compileSass(`./theme/${CONFIG.theme}/assets/css/main.sass`, './output/assets/css/main.css'))
    // compile js
    promises.push(_helpers.uglifyJs(`./theme/${CONFIG.theme}/assets/js/main.js`, './output/assets/js/main.js'))
    return Promise.all(promises).then(() => {
      return Promise.resolve()
    })
  },
  moveRootFolder: () => {
    return new Promise((resolve, reject) => {
      if (CONFIG.rootFolder) {
        _helpers.copyFolderContents(`./output/${CONFIG.rootFolder}/`, `./output/`).then(() => {
          resolve()
        })
      } else {
        console.log('No root page folder has been defined in CONFIG file.')
        resolve()
      }
    })
  },
  compile: (_store) => {
    return module.exports.getAllContent(_store).then(() => {
      return module.exports.createOutputFolders(_store).then(() => {
        return module.exports.createOutputFiles(_store).then(() => {
          return module.exports.createListJsonFiles(_store).then(() => {
            return module.exports.moveRootFolder()
          })
        })
      })
    })
  },
  compileOnce: (_store) => {
    _helpers.deleteFolderRecursive('./output/') // empty output folder for new content
    return module.exports.compile(_store)
  },
  watchForChanges: (_store) => {
    _helpers.startServer()
    module.exports.compileOnce(_store).then(() => {
      console.log('Initial compile completed.')
      watch([path.normalize('./contents/'), path.normalize(`./theme/${CONFIG.theme}/`)], {recursive: true}, (evt, name) => {
        const urlArr = name.split(path.sep)
        console.log(name)
        // recompile pages only
        if (name.includes('contents')) {
          if (name.includes('--page')) {
            module.exports.getAllContent(_store).then(_store => {
              module.exports.createOutputFolders(_store).then(() => {
                module.exports.createOutputPageFiles(_store).then(() => {
                  module.exports.moveRootFolder().then(() => {
                    console.log('Pages recompiled.')
                  })
                })
              })
            })
          // recompile list entries & list index files
          } else if (urlArr.includes('list')) {
            module.exports.getAllContent(_store).then(_store => {
              module.exports.createOutputFolders(_store).then(() => {
                module.exports.createOutputListIndexFiles(_store).then(() => {
                  module.exports.createOutputListEntryFiles(_store).then(() => {
                    module.exports.moveRootFolder().then(() => {
                      console.log('List entries recompiled.')
                    })
                  })
                })
              })
            })
          // recompile list index files
          } else if (name.includes('--list')) {
            module.exports.getAllContent(_store).then(store => {
              module.exports.createOutputFolders(_store).then(() => {
                module.exports.createOutputListIndexFiles(_store).then(() => {
                  module.exports.moveRootFolder().then(() => {
                    console.log('List indexes recompiled.')
                  })
                })
              })
            })
          }
        // recompile assets
        } else if (urlArr.includes('assets')){
          module.exports.prepareAssets().then(() => {
            console.log('Static assets recompiled.')
          })
        } else {
          module.exports.compile(_store)
          console.log('Templates recompiled.')
        }
      })
    })
  },
  init: (_store) => {
    module.exports.server(_store)
  }
}
