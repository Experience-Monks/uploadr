#!/usr/bin/env node

var fs = require('fs');
var path = require('path');
var readEnvFile = require('../lib/read-env-file');
var chalk = require('chalk');
var log = require('../lib/log');
var inquirer = require('inquirer');
var argv = require('./parse-args')();

readEnvFile(function (err, data, filepath) {
  var fileExisted = true;
  if (err) {
    if (err.code === 'ENOENT') {
      fileExisted = false;
    } else {
      console.error(chalk.red('Error reading .env file: ' + err.message));
    }
  }

  data = data || {};
  var authenticate = argv.once ? !data.password : true;
  if (authenticate) {
    log.info(chalk.cyan('uploadr'), '.env configuration');
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
    inquirer.prompt(questions).then(function (results) {
      data.username = results.username;
      data.password = results.password;
      if (!results.password) {
        log.warn('No password specified, using empty string');
        data.password = '';
      }
      var result = JSON.stringify(data, undefined, 2);
      fs.writeFile(filepath, result, function (err) {
        if (err) {
          log.error(err.message);
        } else {
          var type = fileExisted ? 'Updated' : 'Created new';
          log.info(type + ' file at', chalk.bold(path.resolve(filepath)));
        }
        updateGitignores();
      });
    }).catch(function (err) {
      log.error(err.message);
    });
  } else {
    log.info(chalk.cyan('uplaodr'), 'Already authenticated');
    updateGitignores();
  }
});

function updateGitignores () {
  if (!argv.gitignore) return;
  var gitignore = path.resolve(process.cwd(), '.gitignore');
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
      });
    }
  });
}
