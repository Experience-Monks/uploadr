var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var setupAuth = require('./auth');
var log = require('./log');
var upload = require('./upload');
var defined = require('defined');
var ProgressBar = require('progress');

module.exports = function (opt) {
  opt = assign({}, opt);
  var emitter = new EventEmitter();

  if (!opt.dest) {
    throw new TypeError('Must specify destination folder, e.g. --dest /home/foo');
  }

  var progress;
  setupAuth(opt, function (err, auth) {
    if (err) {
      if (err.code === 'ENOENT') err.code = 'NO_ENV_FILE';
      return emitter.emit('error', err);
    }

    // take from opt, fall back to .env file
    var uploadOpts = assign({}, opt, {
      username: opt.username || auth.username,
      host: opt.host || auth.host,
      port: defined(opt.port, auth.port),
      password: opt.password || auth.password,
      onProgress: onProgress,
      onFileUploadStart: onFileUploadStart,
      onStart: onStart
    });

    // run sftp upload
    upload(uploadOpts, function (err, totalFiles) {
      if (err) return emitter.emit('error', err);
      log.info('Upload complete');
      emitter.emit('complete');
    });
  });

  return emitter;

  function onStart (ev) {
    var barTemplate = '  [:bar] :percent :fileDetail';
    progress = new ProgressBar(barTemplate, {
      complete: '=',
      incomplete: '-',
      width: 35,
      total: ev.totalBytes
    });
  }

  function onFileUploadStart (ev) {
    progress.render(getFileDetail(ev));
  }

  function onProgress (ev) {
    var tickOpts = getFileDetail(ev);
    if (ev.bytes > 0) {
      progress.tick(ev.bytes, tickOpts);
    } else {
      progress.render(tickOpts);
    }
  }

  function getFileDetail (ev) {
    var stats = Math.floor((ev.fileBytesTransferred / ev.fileBytesTotal) * 100);
    return {
      fileDetail: '→ ' + ev.fileRelative + ' (' + stats + '%)'
    };
  }
};
