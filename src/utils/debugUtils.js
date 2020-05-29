import { debug as createDebugger } from 'debug';
import chalk from 'chalk';


export const getDebugger = (namespace) => createDebugger(namespace);

export const debugHelper = {
  error: (debug, error) => debug(chalk.red(error.message)),
  success: (debug, msg) => debug(chalk.green(msg)),
};
