#!/usr/bin/env node
var argv = require('minimist')(process.argv.slice(2), {
  alias: {
    src: 's',
    dest: 'd',
    ignore: 'i',
    host: 'h',
    port: 'p',
    username: 'U',
    password: 'P'
  },
  string: [ 'src', 'dest', 'ignore', 'password', 'username', 'host' ]
});

var uploadr = require('../');
var log = require('../lib/log');

uploadr(argv).on('error', function (err) {
  log.error(err.message);
  console.error(err.stack.split('\n').slice(1).join('\n'));
  process.exit(1);
});
