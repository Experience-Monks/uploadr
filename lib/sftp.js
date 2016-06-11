var log = require('./log');
var Connection = require('ssh2');
var noop = function () {};
var EventEmitter = require('events').EventEmitter;

module.exports = function (options, callback) {
  var username = options.username || 'anonymous';
  var finished = false;
  var connection, sftp;

  var api = new EventEmitter();
  api.end = end;
  api.mkdir = mkdir;
  api.createWriteStream = createWriteStream;

  // try to connect
  connect(callback);
  return api;

  function checkSFTP () {
    if (!sftp) {
      return api.emit('error', new Error('Could not mkdir; SFTP is closed'));
    }
  }

  function mkdir () {
    checkSFTP();
    return sftp.mkdir.apply(sftp, Array.prototype.slice.call(arguments));
  }

  function createWriteStream () {
    checkSFTP();
    return sftp.createWriteStream.apply(sftp, Array.prototype.slice.call(arguments));
  }

  function end () {
    finished = true;
    if (sftp) sftp.end();
    if (connection) connection.end();
    connection = null;
    sftp = null;
  }

  function connect (done) {
    finished = false;
    log.info('SFTP Authenticating with password');

    connection = new Connection();
    connection.once('ready', function () {
      log.info('SSH Connecting');
      connection.sftp(function (err, sftpInstance) {
        if (err) {
          throw err;
        }

        sftp = sftpInstance;
        sftp.once('end', function () {
          sftp = null;
          if (!finished) {
            api.emit('error', new Error('SFTP closed abruptly'));
          }
        });

        done(api);
        done = noop;
      });
    });

    connection.once('error', function (err) {
      // assuming this error could be thrown some time
      // after connection is successful ?
      api.emit('error', err);
    });

    connection.on('close', function () {
      if (!finished) {
        api.emi('error', new Error('SFTP closed abruptly'));
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

    connection.connect(connectOpts);
  }
};
