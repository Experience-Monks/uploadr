var fs = require('fs');
var path = require('path');
var stripComments = require('strip-json-comments');
var noop = function () {};
var fileName = '.env';

module.exports = function (opt, cb) {
  if (typeof opt === 'function') {
    cb = opt;
    opt = {};
  }
  cb = cb || noop;
  opt = opt || {};
  var basedir = opt.basedir || process.cwd();
  readFile(path.resolve(basedir, fileName));

  function readFile (file) {
    fs.readFile(file, 'utf8', function (err, data) {
      if (err) return cb(err, undefined, file);
      var result;
      try {
        if (!data) result = {};
        else result = JSON.parse(stripComments(data));
      } catch (err) {
        err.code = 'JSON_PARSE_ERROR';
        return cb(err, undefined, file);
      }
      cb(null, result, file);
    });
  }
};
