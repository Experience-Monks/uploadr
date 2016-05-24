var fs = require('fs');
var path = require('path');
var stripComments = require('strip-json-comments');
var fileName = '.env';

module.exports = function (opt, cb) {
  opt = opt || {};
  var basedir = opt.basedir || process.cwd();
  readFile(path.resolve(basedir, fileName));

  function readFile (file) {
    fs.readFile(file, 'utf8', function (err, data) {
      if (err) return cb(err);
      var result;
      try {
        result = JSON.parse(stripComments(data));
      } catch (err) {
        return cb(err);
      }
      cb(null, result);
    });
  }
};
