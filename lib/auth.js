var fs = require('fs');
var path = require('path');
var readEnvFile = require('./read-env-file');
var chalk = require('chalk');
var log = require('./log');
var inquirer = require('inquirer');

module.exports = function auth (opts, done) {
  opts = opts || {};

  var noSave = opts.save === false;
  var basedir = opts.basedir || process.cwd();

  readEnvFile(function (err, data, filepath) {
    data = data || {};

    if (!opts.auth) {
      // If user doesn't want to auth, just bail out now
      return done(err, data);
    } else {
      // User wants to auth, we will only do it if necessary
      var usePrompt = opts.force || typeof data.password !== 'string';
      // Prompts, writes .env, fixes .gitignore
      runAuthSeries(usePrompt, err, data, filepath, done);
    }
  });

  function runAuthSeries (usePrompt, err, data, filepath, next) {
    // Otherwise, a missing/problematic .env file can be ignored
    var fileExisted = true;
    if (err) {
      if (err.code === 'ENOENT') {
        // no file existed, we can't fill in defaults
        fileExisted = false;
      } else {
        // Some other type of error...
        log.warn('Error reading .env file: ' + err.message);
      }
    }

    var mainSeries = Promise.resolve();
    if (usePrompt) {
      log.info('Configuring .env file...');
      var questions = [
        {
          type: 'input',
          name: 'username',
          message: 'Username:',
          default: data.username || 'anonymous'
        },
        {
          type: 'password',
          name: 'password',
          message: 'Password:'
        }
      ];
      mainSeries = inquirer
          .prompt(questions)
          .then(onResult)
          .then(writeEnv)
          .then(updateGitignores);
    }

    // final callback since I prefer these in rest of codebase
    mainSeries.then(function () {
      next(null, data);
    }, function (err) {
      next(err);
    });

    function onResult (results) {
      data.username = results.username;
      data.password = results.password;
      if (!results.password) {
        log.warn('No password specified, using empty string');
        data.password = '';
      }
    }

    function writeEnv () {
      if (noSave) return Promise.resolve();
      return new Promise(function (resolve, reject) {
        var result = JSON.stringify(data, undefined, 2);
        fs.writeFile(filepath, result, function (err) {
          if (err) return reject(err);
          var type = fileExisted ? 'Updated' : 'Created new';
          log.info(type + ' file at', chalk.bold(path.resolve(filepath)));
          resolve();
        });
      });
    }
  }

  function updateGitignores () {
    if (noSave) return Promise.resolve();
    return new Promise(function (resolve) {
      var gitignore = path.resolve(basedir, '.gitignore');
      var pathFile = chalk.bold(gitignore);
      fs.readFile(gitignore, function (err, data) {
        if (err) {
          if (err.code !== 'ENOENT') {
            log.warn('Error reading ' + pathFile, err.message);
          } else {
            log.info('Writing ' + pathFile);
          }
        }
        data = data || '';
        if (!/^\.env[\n\r]?/gm.test(data)) {
          var prefix = data.length > 0 ? '\n' : '';
          if (data.length > 0 && !/[\n\r]$/.test(data)) {
            prefix += '\n';
          }
          data += prefix + '# uploadr auth\n.env\n';
          fs.writeFile(gitignore, data, function (err) {
            if (err) {
              log.error('Could not write ' + pathFile, err.message);
            }
            log.info('Added .env to ' + pathFile);
            resolve();
          });
        } else {
          resolve();
        }
      });
    });
  }
};
