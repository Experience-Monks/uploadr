// Much of the deploy code is from here:
// https://github.com/weixin/node-sftp-deploy

var path = require('path');
var async = require('async');
var parents = require('parents');
var assign = require('object-assign');
var fs = require('fs-extra');
var chalk = require('chalk');
var log = require('./log');
var createFileMatch = require('./file-matching');
var pathIsAbsolute = require('path-is-absolute');

var noop = function () {};
var progressStream = require('progress-stream');
var connectSFTP = require('./sftp');

var DRY_RUN_DELAY = 20;
var PROGRESS_TIME_INTERVAL = 100;

var normalizePath = function (p) {
  return p.replace(/[\/\\]/g, path.sep);
};

var toPlatform = function (p, platform) {
  var regex = /[\\\/]/g;
  return p.replace(regex, /^win/i.test(platform) ? '\\' : '/');
};

module.exports = function (options, callback) {
  options = assign({}, options);

  // normalize seps to current node platform,
  // we will replace later with specified remote platform (default unix)
  var remotePath = normalizePath(options.dest || '');

  if (options.host === undefined || options.host === '') {
    throw new TypeError('must specify "host" option');
  }

  if (!remotePath || typeof remotePath !== 'string') {
    return new TypeError('Must specify a valid "dest" option');
  }

  var dryRun = options.dryRun;
  var basedir = options.basedir || process.cwd();
  var sourcePath = options.src || basedir;
  var remotePlatform = options.remotePlatform || 'unix';

  // ensure source is absolute
  sourcePath = pathIsAbsolute(sourcePath) ? sourcePath : path.resolve(basedir, sourcePath);

  var acceptFile = createFileMatch(options);
  var filesUploaded = 0;
  var filesProcessed = 0;
  var totalFiles = 0;
  var totalBytes = 0;
  var mkDirCache = {};

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
      totalBytes = items.reduce(function (a, b) {
        return a + b.stats.size;
      }, 0);

      if (totalFiles <= 0) {
        log.warn('No files to upload');
        callback(null);
      } else {
        if (options.onStart) {
          options.onStart({
            count: 0,
            totalBytes: totalBytes,
            total: totalFiles
          });
        }

        if (dryRun) {
          uploadFiles(null, items);
        } else {
          var connection = connectSFTP(options, function (sftp) {
            uploadFiles(sftp, items);
          }).once('error', function (err) {
            connection.end();
            callback(err);
            callback = noop;
          });
        }
      }
    });

  function uploadFiles (sftp, files) {
    log.info('Uploading ' + chalk.bold(totalFiles) + ' files...');
    async.eachSeries(files, function (file, done) {
      var filePath = file.path;
      var fileRelative = path.relative(sourcePath, filePath);
      var finalRemotePath = path.join(remotePath, path.dirname(fileRelative));

      // ensure final remote path is platform specific
      finalRemotePath = toPlatform(finalRemotePath, remotePlatform);

      // get all relative directories
      var fileDirs = parents(path.dirname(fileRelative));

      // ensure the dirs we create start with remote path
      fileDirs = fileDirs.map(function (d) {
        return path.join(remotePath, d);
      });

      // filter out any that we've already created
      fileDirs = fileDirs.filter(function (d) {
        return !(d in mkDirCache);
      });

      async.whilst(function () {
        return fileDirs && fileDirs.length;
      }, function (next) {
        var d = fileDirs.pop();
        mkDirCache[d] = true;

        if (dryRun) {
          next();
        } else {
          var remoteDir = toPlatform(d, remotePlatform);
          sftp.mkdir(remoteDir, {
            mode: '0755'
          }, function () {
            next();
          });
        }
      }, function () {
        var fileBytes = file.stats.size;
        var progressTransferred = 0;

        var getProgressEvent = function (byteDelta) {
          return {
            count: filesProcessed,
            total: totalFiles,
            totalBytes: totalBytes,
            bytes: byteDelta,
            file: finalRemotePath,
            fileBytesTransferred: progressTransferred,
            fileBytesTotal: fileBytes,
            fileRelative: fileRelative
          };
        };

        var onProgressTick = function (progressData) {
          var byteDelta = progressData.delta;
          progressTransferred += byteDelta;
          if (options.onProgress) {
            options.onProgress(getProgressEvent(byteDelta));
          }
        };

        var finishStream = function (err) {
          onProgressTick = noop; // stop recording progress-stream events here

          if (err) {
            err = new Error('File upload failed: ' + filePath + '\n' + err.message);
            if (options.onFileError) options.onFileError(err);
          } else {
            filesUploaded++;
          }
          filesProcessed++;
          if (options.onProgress) {
            progressTransferred = dryRun ? 0 : fileBytes;
            var byteDelta = Math.max(0, fileBytes - progressTransferred);
            options.onProgress(getProgressEvent(byteDelta));
          }
          done();
        };

        if (options.onFileUploadStart) {
          options.onFileUploadStart(getProgressEvent(0));
        }

        if (dryRun) {
          setTimeout(function () {
            finishStream(null);
          }, DRY_RUN_DELAY);
        } else {
          var progress = progressStream({
            time: PROGRESS_TIME_INTERVAL,
            speed: 1,
            length: file.stats.size
          });
          var readStream = fs.createReadStream(filePath);
          var stream = sftp.createWriteStream(finalRemotePath, {
            flags: 'w',
            encoding: null,
            mode: '0666',
            autoClose: true
          });
          progress.on('progress', onProgressTick);
          readStream.pipe(progress).pipe(stream);
          stream.once('error', function (err) {
            finishStream(err);
            finishStream = noop;
          });
          stream.on('close', function () {
            finishStream(null);
          });
        }
      });
    }, function () {
      if (sftp) sftp.end();
      if (callback) {
        callback(null, filesUploaded);
      }
    });
  }
};
