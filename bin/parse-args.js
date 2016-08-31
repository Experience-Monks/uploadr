var minimist = require('minimist');

module.exports = function () {
  return minimist(process.argv.slice(2), {
    alias: {
      src: 's',
      dest: 'd',
      ignore: 'i',
      host: 'h',
      port: 'P',
      username: 'u',
      password: 'p',
      key: 'k',
      only: 'o',
      dryRun: 'dry-run',
      version: 'v',
      save: 'S',
      remotePlatform: 'remote-platform'
    },
    default: {
      prompt: true
    },
    string: [ 'src', 'dest', 'ignore', 'password', 'username', 'host', 'remotePlatform', 'key' ],
    boolean: [ 'save', 'prompt', 'dryRun' ]
  });
};
