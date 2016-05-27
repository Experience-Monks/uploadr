var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var readEnv = require('./read-env-file');
var log = require('./log');
var upload = require('./sftp-upload');
var defined = require('defined');
var ProgressBar = require('progress');

module.exports = function (opt) {
  opt = assign({}, opt);
  var emitter = new EventEmitter();

  if (!opt.src || !opt.dest) {
    throw new TypeError('Must specify src and dest options');
  }

  var progress;
  readEnv(opt, function (err, auth) {
    if (err) {
      if (err.code === 'ENOENT') err.type = 'NO_ENV_FILE';
      return emitter.emit('error', err);
    }

    // take from opt, fall back to .env file
    var connection = assign({}, opt, {
      username: opt.username || auth.username,
      host: opt.host || auth.host,
      port: defined(opt.port, auth.port),
      password: opt.password || auth.password,
      onProgress: onProgress
    });

    // run sftp upload
    upload(connection, function (err, totalFiles) {
      if (err) return emitter.emit('error', err);
      log.info('Upload complete');
      emitter.emit('complete');
    });
  });

  return emitter;

  function onProgress (count, total) {
    if (!progress) {
      // Styling TBD
      var barTemplate = '  [:bar] :percent';
      progress = new ProgressBar(barTemplate, {
        complete: '=',
        incomplete: '-',
        width: 40,
        total: total
      });
    } else {
      progress.tick();
    }
  }
};
