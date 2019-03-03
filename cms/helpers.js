const fs = require('fs')
const fse = require('fs-extra')
const path = require('path')
const http = require('http-server')
const sass = require('node-sass')
const UglifyJS = require('uglify-es')
const CONFIG = require('./../config')
const FtpDeploy = require('ftp-deploy')
const ftpDeploy = new FtpDeploy()

module.exports = {
  // method below source: https://stackoverflow.com/a/40686853/1004946
  mkDirByPathSync: (targetDir, { isRelativeToScript = false } = {}) => {
    const sep = path.sep
    const initDir = path.isAbsolute(targetDir) ? sep : ''
    const baseDir = isRelativeToScript ? __dirname : '.'
    return targetDir.split(sep).reduce((parentDir, childDir) => {
      const curDir = path.resolve(baseDir, parentDir, childDir)
      try {
        fs.mkdirSync(curDir)
      } catch (err) {
        if (err.code === 'EEXIST') { // curDir already exists!
          return curDir
        }
        // To avoid `EISDIR` error on Mac and `EACCES`-->`ENOENT` and `EPERM` on Windows.
        if (err.code === 'ENOENT') { // Throw the original parentDir error on curDir `ENOENT` failure.
          throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`)
        }
        const caughtErr = ['EACCES', 'EPERM', 'EISDIR'].indexOf(err.code) > -1
        if (!caughtErr || caughtErr && curDir === path.resolve(targetDir)) {
          throw err // Throw if it's just the last created dir.
        }
      }
      return curDir
    }, initDir)
  },
  slugify: (string) => {
    const a = 'àáäâãåèéëêìíïîòóöôùúüûñçßÿœæŕśńṕẃǵǹḿǘẍźḧ·/_,:;'
    const b = 'aaaaaaeeeeiiiioooouuuuncsyoarsnpwgnmuxzh------'
    const p = new RegExp(a.split('').join('|'), 'g')
    return string.toString().toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with
      .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
      .replace(/&/g, '-and-') // Replace & with ‘and’
      .replace(/[^\w\-]+/g, '') // Remove all non-word characters
      .replace(/\-\-+/g, '-') // Replace multiple — with single -
      .replace(/^-+/, '') // Trim — from start of text .replace(/-+$/, '') // Trim — from end of text
  },
  // method below source: https://geedew.com/remove-a-directory-that-is-not-empty-in-nodejs/
  deleteFolderRecursive: (url) => {
    if (fs.existsSync(url)) {
      fs.readdirSync(url).forEach((file) => {
        var curPath = url + "/" + file
        if(fs.lstatSync(curPath).isDirectory()) { // recurse
          module.exports.deleteFolderRecursive(path.normalize(curPath))
        } else { // delete file
          fs.unlinkSync(curPath)
        }
      })
      fs.rmdirSync(url)
    }
  },
  compileSass: (_source, _target) => {
    return new Promise((resolve, reject) => {
      sass.render({
        file: _source,
        outputStyle: 'compressed',
        indentedSyntax: CONFIG.indentedSass || false
      }, (err, result) => {
        if (err) {
          reject(err)
        } else {
          fs.writeFile(path.normalize(_target), result && result.css ? result.css : '', (err) => {
            if (err) {
              reject(err)
            } else {
              resolve(result)
            }
          })
        }
      })
    })
  },
  uglifyJs: (_source, _target) => {
    return new Promise((resolve, reject) => {
      fs.readFile(path.normalize(_source), 'utf8', (err, data) => {
        if (err) {
          reject(err)
        } else {
          const uglified = UglifyJS.minify(data, {
            ie8: CONFIG.ie8support || false
          })
          if (uglified && uglified.error) {
            reject(uglified.error)
          } else if (uglified && uglified.code) {
            fs.writeFile(_target, uglified.code, (error) => {
              if (error) {
                reject(error)
              } else {
                resolve()
              }
            })
          }
        }
      })
    })
  },
  copyFolderContents: (_sourcePath, _targetPath) => {
    return new Promise((resolve, reject) => {
      fs.readdir(path.normalize(_sourcePath), (err, files) => {
        if (!err) {
          let promises = []
          files.forEach(file => {
            promises.push(new Promise((resolve, reject) => {
              const sourceFile = `${_sourcePath}${file}`
              const targetFile = `${_targetPath}${file}`
              fs.writeFile(path.normalize(targetFile), fs.readFileSync(path.normalize(sourceFile))  , (err) => {
                if (err) {
                  reject(err)
                } else {
                  resolve()
                }
              })
            }))
          })
          Promise.all(promises).then(() => {
            resolve()
          })
        } else {
          reject(err)
        }
      })
    })
  },
  copyFolderRecursively: (_sourcePath, _targetPath) => {
    return new Promise((resolve, reject) => {
      fse.copy(path.normalize(_sourcePath), path.normalize(_targetPath)).then(() => {
        resolve()
      }).catch(err => {
        reject(err)
      })
    })
  },
  startServer: () => {
    const server = http.createServer({root: './output/'})
    server.listen(CONFIG.port || 3000)
    console.log(`Output folder is now served under http://localhost:${CONFIG.port || 3000}`)
  },
  deployViaFtp: () => {
    if (CONFIG && CONFIG.deployViaFtp === true) {
      if (CONFIG.ftpConfig && CONFIG.ftpConfig.user && CONFIG.ftpConfig.localRoot) {
        ftpDeploy.on('uploading', (data) => {
          process.stdout.write(`Ftp deploy progress: ${data.transferredFileCount} / ${data.totalFilesCount}\r`)
        })
        ftpDeploy.deploy(CONFIG.ftpConfig).then(() => {
          console.log('All files has been deployed to your ftp server.')
        }).catch(err => {
          throw new Error(err && err.message ? err.message : err)
        })
      } else {
        throw new Error('ERROR: Fill in ftp credentials in config.js file to enable built-in deployment.')
      }
    } else {
      throw new Error('ERROR: Deployment via ftp is turned off in config.js file.')
    }
  }
}
