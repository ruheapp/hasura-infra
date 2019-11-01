import * as path from 'path';

import * as dev from './infra-prod/index';
import * as prod from './infra-prod/index';

if (!process.env['HASURA_SCRIPT_PREFIX']) {
  throw new Error("Make sure to dot-source script/env.sh first!")
}

module.exports = process.env['HASURA_PRODUCTION'] === 'true' ? prod : dev;