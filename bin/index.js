#!/usr/bin/env node
var chalk = require('chalk');
var argv = require('./parse-args')();
var uploadr = require('../');
var log = require('../lib/log');

uploadr(argv).on('error', function (err) {
  if (err.code === 'NO_ENV_FILE') {
    log.error('No ' + chalk.bold('.env') + ' file found in current directory\n' +
      'A JSON file with ' + chalk.bold('{ username, password }') +
      ' required for FTP authentication.');
  } else {
    log.error(err.message);
    console.error(err.stack.split('\n').slice(1).join('\n'));
  }
  process.exit(1);
});
