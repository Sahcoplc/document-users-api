import yargs from 'yargs'

export const CliArgs = yargs
    .usage('Usage: $0 -p [PORT]')
    .alias('p', 'port')
    .alias('s', 'scenario')
    .alias('c', 'cache location')
    .alias('ro', 'runtime-options')
    .describe('port', '(Optional) Port Number - default is 3000')
    .describe('scenario', '(Optional) Scenario name - default is AAD')
    .describe('cache location', '(Optional) Cache location - default is data/cache.json')
    .describe('runtime-options', '(Optional) Runtime options to inject into the application - default is null')
    .strict()
    .argv;