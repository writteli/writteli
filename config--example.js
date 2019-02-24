// IMPORTANT: RENAME THIS FILE TO 'config.js'
module.exports = {
  port: 3000, // port for localhost server
  theme: 'brutalist', // name of the theme
  indentedSass: true, // keep true if you want write your stylesheets using indented Sass syntax
  ie8support: true, // keep true if you want to support IE8 when uglifying your website's JavaScript code
  vendorsPath: '', // if you use any 3rd party vendors and want to copy it in the final website output - set the path here
  recompile: true, // keep true if you want your `npm run server` command to update the changes
  recompileInterval: 5000, // interval of how often server should recompile the page in ms (best to keep it 5000+)
  rootFolder: 'home', // slug of the page/folder which should be served in your webpage output at `/` (home/index route)
  excludeDrafts: true, // set to true if you want to compile --list entries that are marked as 'draft'
  paginationSlug: 'page/', // what slug will have pagination - have to end with `/`
  pagination: { // key-value based object, where key is the slug of the --list that will have pagination and value is per-page amount of entries it should have
    news: 5
  },
  deployViaFtp: false, // if you want to deploy your files via writte.li itself via deploy command
  ftpConfig: {
    user: '<your ftp user name>',
    password: '<your ftp password>',
    host: '<your ftp host>',
    localRoot: './output', // don't change it, it points directly to the source folder of generated website
    remoteRoot: '/<path to the folder on your ftp server>/', // IMPORTANT: can't handle just '/' or '' as a path at the moment
    include: ['*', '**/*'], // don't change it
    deleteRemote: false, // if you want always to remove old contents in ftp, change it to true
    forcePasv: true // ftp will force to run in passive mode (EPSV command is not sent)
  }
}
