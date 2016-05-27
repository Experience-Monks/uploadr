#!/usr/bin/env node
var argv = require('./parse-args')();

var uploadr = require('../');
var log = require('../lib/log');

uploadr(argv).on('error', function (err) {
  log.error(err.message);
  console.error(err.stack.split('\n').slice(1).join('\n'));
  process.exit(1);
});
