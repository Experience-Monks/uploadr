var createIgnore = require('ignore');
var path = require('path');
var fs = require('fs');
var log = require('./log');

var defaultIgnores = [
  '.git',
  '.*',
  '*.*~',
  'node_modules',
  'bower_components'
];

module.exports = function (options) {
  options = options || {};
  var basedir = options.basedir || process.cwd();
  var rootDir = options.src || basedir;

  var ignorer = createIgnore();
  var ftpIgnore = path.resolve(basedir, '.ftpignore');

  if (fs.existsSync(ftpIgnore)) {
    try {
      ignorer.add(fs.readFileSync(ftpIgnore, 'utf8'));
    } catch (err) {
      log.warn('Could not read .ftpignore file in current working directory');
    }
  }

  var ignoreRules = [].concat(options.ignore).concat(defaultIgnores).filter(Boolean);
  var ignoreFilter = ignorer.add(ignoreRules).createFilter();

  var onlyRules = [].concat(options.only).filter(Boolean);
  var onlyFilter = createIgnore().add(onlyRules).createFilter();

  return function accept (item) {
    // First check if file is ignored, this takes precedence
    var relativeFile = path.relative(rootDir, item.path);
    if (!ignoreFilter(relativeFile)) {
      return false;
    }

    // Now check if user doesn't want to explicitly only include this file
    if (onlyRules.length > 0 && onlyFilter(relativeFile)) {
      return false;
    }
    return true;
  };
};
