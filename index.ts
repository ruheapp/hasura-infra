import * as path from 'path';

if (!process.env['HASURA_SCRIPT_PREFIX']) {
  throw new Error("Make sure to dot-source script/env.sh first!")
}

const prefix = process.env['HASURA_SCRIPT_PREFIX'];

console.log(`About to run ${prefix}`)
module.exports = require(`./${prefix}/../index`);