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
      incremental: 'I',
      dryRun: 'dry-run',
      verbose: 'V',
      version: 'v'
    },
    default: {
      gitignore: true
    },
    string: [ 'src', 'dest', 'ignore', 'password', 'username', 'host' ],
    boolean: [ 'once', 'gitignore' ] // for uploadr-env
  });
};
