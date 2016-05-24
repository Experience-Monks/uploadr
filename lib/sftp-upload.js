// Most of the deploy code is from here:
// https://github.com/weixin/node-sftp-deploy

var path = require('path');
var Connection = require('ssh2');
var async = require('async');
var parents = require('parents');
var assign = require('object-assign');
var fs = require('fs-extra');
var chalk = require('chalk');
var log = require('./log');
var match = require('micromatch');
var defaultIgnores = require('./ignores');

var normalizePath = function (path) {
  return path.replace(/\\/g, '/');
};

module.exports = function (options, callback) {
  options = assign({}, options);

  if (options.host === undefined || options.host === '') {
    throw new Error('must specify "host" option');
  }

  var username = options.username || 'anonymous';
  var remotePath = options.dest || '';
  var sourcePath = options.src || './';
  var remotePlatform = options.remotePlatform || 'unix';
  var ignore = [].concat(options.ignore).concat(defaultIgnores).filter(Boolean);

  var filesUploaded = 0;
  var filesProcessed = 0;
  var totalFiles = 0;
  var mkDirCache = {};
  var finished = false;
  var connectionCache = null;

  // get all files to be uploaded
  var items = [];
  fs.walk(sourcePath)
    .on('data', function (item) {
      if (!item.stats.isDirectory() && acceptFile(item)) {
        items.push(item);
      }
    })
    .on('end', function () {
      totalFiles = items.length;

      if (totalFiles <= 0) {
        log.warn('No files to upload');
        callback(null);
      } else {
        if (options.onProgress) options.onProgress(0, totalFiles);
        connectSftp(function (sftp) {
          uploadFiles(sftp, items);
        });
      }
    });

  function acceptFile (item) {
    if (ignore.length === 0) return true;
    return match(item.path, ignore).length === 0;
  }

  function uploadFiles (sftp, files) {
    log.info('Uploading ' + chalk.bold(totalFiles) + ' files...');
    async.eachSeries(files, function (file, done) {
      var filepath = file.path.replace(/\\/, '/');

      var pathArr = sourcePath.replace(/\/$/, '').split('/');
      var projectName = pathArr[pathArr.length - 1];

      var relativePath = filepath.split(projectName + '/')[1];
      var finalRemotePath = normalizePath(path.join(remotePath, relativePath));

      var dirname = path.dirname(finalRemotePath);

      var fileDirs = parents(dirname)
        .map(function (d) {
          return d.replace(/^\/~/, '~');
        })
        .map(normalizePath);

      if (dirname.search(/^\//) === 0) {
        fileDirs = fileDirs.map(function (dir) {
          if (dir.search(/^\//) === 0) {
            return dir;
          }
          return '/' + dir;
        });
      }

      fileDirs = fileDirs.filter(function (d) {
        return d.length >= remotePath.length && !mkDirCache[d];
      });

      async.whilst(function () {
        return fileDirs && fileDirs.length;
      }, function (next) {
        var d = fileDirs.pop();
        mkDirCache[d] = true;

        if (remotePlatform && remotePlatform.toLowerCase().indexOf('win') !== -1) {
          d = d.replace('/', '\\');
        }

        sftp.mkdir(d, {
          mode: '0755'
        }, function () {
          next();
        });
      }, function () {
        var readStream = fs.createReadStream(filepath);

        var stream = sftp.createWriteStream(finalRemotePath, {
          flags: 'w',
          encoding: null,
          mode: '0666',
          autoClose: true
        });

        readStream.pipe(stream);

        stream.on('close', function (err) {
          if (err) {
            err = new Error('File upload failed: ' + filepath + '\n' + err.message);
            if (options.onFileError) options.onFileError(err);
          } else {
            filesUploaded++;
          }
          filesProcessed++;
          if (options.onProgress) options.onProgress(filesProcessed, totalFiles);
          done();
        });
      });
    }, function () {
      finished = true;

      if (sftp) {
        sftp.end();
      }
      if (connectionCache) {
        connectionCache.end();
      }

      if (callback) {
        callback(null, filesUploaded);
      }
    });
  }

  function connectSftp (onConnected) {
    log.info('SFTP Authenticating with password');

    var c = new Connection();
    connectionCache = c;
    c.on('ready', function () {
      log.info('SSH Connecting');
      c.sftp(function (err, sftp) {
        if (err) {
          throw err;
        }

        sftp.on('end', function () {
          sftp = null;
          if (!finished) {
            log.error('SFTP closed abruptly');
          }
        });
        onConnected(sftp);
      });
    });

    c.on('error', function (err) {
      callback(err);
    });

    c.on('close', function () {
      if (!finished) {
        log.error('SFTP closed abruptly');
      }
    });

    var connectOpts = {
      host: options.host,
      port: options.port || 22,
      username: username
    };

    if (options.password) {
      connectOpts.password = options.password;
    }

    if (typeof options.timeout !== 'undefined') {
      connectOpts.readyTimeout = options.timeout;
    }

    c.connect(connectOpts);
  }
};
