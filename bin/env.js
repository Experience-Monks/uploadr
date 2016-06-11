#!/usr/bin/env node

var argv = require('./parse-args')();
var auth = require('../lib/auth');
var log = require('../lib/log');

auth(argv, function (err, data) {
  if (err) return log.error(err);
});
