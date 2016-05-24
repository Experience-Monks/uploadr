var chalk = require('chalk');

module.exports.info = function () {
  console.error(chalk.bold(chalk.green('✔')), join(arguments));
};

module.exports.warn = function () {
  console.error(chalk.bold(chalk.yellow('WARN')), join(arguments));
};

module.exports.error = function () {
  console.error(chalk.bold(chalk.red('ERROR')), join(arguments));
};

function join (list) {
  return Array.prototype.join.call(list, ' ');
}

// useful symbols... ⚠✗✔
